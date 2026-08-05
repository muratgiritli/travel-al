import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, chatSessionsTable, chatMessagesTable } from "@workspace/db";
import {
  CreateChatSessionBody,
  CreateChatSessionResponse,
  GetChatMessagesParams,
  GetChatMessagesResponse,
  SendChatMessageParams,
  SendChatMessageBody,
  SendChatMessageResponse,
} from "@workspace/api-zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router: IRouter = Router();

// POST /chat/session — create a new chat session
router.post("/chat/session", async (req, res): Promise<void> => {
  const parsed = CreateChatSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(chatSessionsTable)
    .values({ passportCountryCode: parsed.data.passportCountryCode })
    .returning();

  res.status(201).json(CreateChatSessionResponse.parse(session));
});

// GET /chat/session/:sessionId — get a single chat session
router.get("/chat/session/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(CreateChatSessionResponse.parse(session));
});

// GET /chat/session/:sessionId/messages — get messages for a session
router.get("/chat/session/:sessionId/messages", async (req, res): Promise<void> => {
  const params = GetChatMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, params.data.sessionId))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json(GetChatMessagesResponse.parse(messages));
});

// POST /chat/session/:sessionId/messages — send a message and stream AI reply via SSE
router.post("/chat/session/:sessionId/messages", async (req, res): Promise<void> => {
  const params = SendChatMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Verify session exists
  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, params.data.sessionId));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Save user message
  await db.insert(chatMessagesTable).values({
    sessionId: params.data.sessionId,
    role: "user",
    text: parsed.data.text,
  });

  // Fetch full conversation history for context (including the message just saved)
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, params.data.sessionId))
    .orderBy(asc(chatMessagesTable.createdAt));

  const systemPrompt =
    `You are a Turkey travel expert. The user holds a ${session.passportCountryCode} passport. ` +
    `Answer only Turkey travel questions — visa requirements, destinations, accommodation, food, ` +
    `transport, culture, and itineraries. If asked about something unrelated to Turkey travel, ` +
    `politely redirect the user back to Turkey travel topics.`;

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.text,
    })),
  ];

  const wantsStream = req.headers.accept?.includes("text/event-stream") ?? false;

  if (wantsStream) {
    // ── SSE streaming path ────────────────────────────────────────────────────
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let assistantText = "";
    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: chatMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content ?? "";
        if (token) {
          assistantText += token;
          // Escape newlines so each SSE message stays on one line
          const escaped = token.replace(/\n/g, "\\n");
          res.write(`data: ${escaped}\n\n`);
        }
      }
    } catch (err) {
      res.write(`data: [ERROR] AI service unavailable. Please try again later.\n\n`);
      res.end();
      return;
    }

    // Persist the full assistant reply after stream completes
    if (assistantText) {
      await db.insert(chatMessagesTable).values({
        sessionId: params.data.sessionId,
        role: "assistant",
        text: assistantText,
      });
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } else {
    // ── Non-streaming JSON path (used by mobile and generated API client) ────
    let assistantText: string;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: chatMessages,
      });
      assistantText = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (err) {
      res.status(502).json({ error: "AI service unavailable. Please try again later." });
      return;
    }

    // Save and return assistant message
    const [assistantMessage] = await db
      .insert(chatMessagesTable)
      .values({
        sessionId: params.data.sessionId,
        role: "assistant",
        text: assistantText,
      })
      .returning();

    res.status(201).json(SendChatMessageResponse.parse(assistantMessage));
  }
});

export default router;
