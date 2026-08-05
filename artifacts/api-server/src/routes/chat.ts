import { Router, type IRouter } from "express";
import { eq, asc, desc } from "drizzle-orm";
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

// GET /chat/sessions — list recent sessions for a device
router.get("/chat/sessions", async (req, res): Promise<void> => {
  const deviceId = typeof req.query.deviceId === "string" ? req.query.deviceId.trim() : "";
  if (!deviceId) {
    res.status(400).json({ error: "deviceId query param is required" });
    return;
  }

  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.deviceId, deviceId))
    .orderBy(desc(chatSessionsTable.createdAt))
    .limit(10);

  res.json(sessions.map(s => CreateChatSessionResponse.parse(s)));
});

// POST /chat/session — create a new chat session
router.post("/chat/session", async (req, res): Promise<void> => {
  const parsed = CreateChatSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(chatSessionsTable)
    .values({
      passportCountryCode: parsed.data.passportCountryCode,
      deviceId: parsed.data.deviceId ?? null,
    })
    .returning();

  res.status(201).json(CreateChatSessionResponse.parse(session));
});

// DELETE /chat/session/:sessionId — permanently delete a session and its messages
router.delete("/chat/session/:sessionId", async (req, res): Promise<void> => {
  const { sessionId } = req.params;
  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const [deleted] = await db
    .delete(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.status(204).end();
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

  // Cap history to control API costs and avoid exceeding the context window.
  // Adjust MAX_HISTORY_MESSAGES env var without a code deploy. Default: 20.
  const MAX_HISTORY_MESSAGES = parseInt(process.env.MAX_HISTORY_MESSAGES ?? "20", 10);
  const historyTrimmed = history.length > MAX_HISTORY_MESSAGES;
  const cappedHistory = history.slice(-MAX_HISTORY_MESSAGES);

  const systemPrompt =
    `You are a Turkey travel expert. The user holds a ${session.passportCountryCode} passport. ` +
    `Answer only Turkey travel questions — visa requirements, destinations, accommodation, food, ` +
    `transport, culture, and itineraries. If asked about something unrelated to Turkey travel, ` +
    `politely redirect the user back to Turkey travel topics.`;

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...cappedHistory.map((m) => ({
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

    // Notify client if old messages were trimmed from the context window
    if (historyTrimmed) {
      res.write("data: [TRIMMED]\n\n");
    }

    let assistantText = "";
    let clientDisconnected = false;
    let openaiStream: Awaited<ReturnType<typeof openai.chat.completions.create>> & { controller?: AbortController } | null = null;

    // Abort the OpenAI stream as soon as the client disconnects
    req.on("close", () => {
      clientDisconnected = true;
      if (openaiStream && "controller" in openaiStream && openaiStream.controller) {
        openaiStream.controller.abort();
        console.log(`[chat] Client disconnected mid-stream for session ${params.data.sessionId}; OpenAI stream aborted.`);
      }
    });

    try {
      openaiStream = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: chatMessages,
        stream: true,
      });

      for await (const chunk of openaiStream) {
        if (clientDisconnected) break;
        const token = chunk.choices[0]?.delta?.content ?? "";
        if (token) {
          assistantText += token;
          // Escape newlines so each SSE message stays on one line
          const escaped = token.replace(/\n/g, "\\n");
          res.write(`data: ${escaped}\n\n`);
        }
      }
    } catch (err: unknown) {
      // Ignore AbortError — that's an intentional client-disconnect abort
      const isAbort =
        err instanceof Error && (err.name === "AbortError" || err.message?.includes("aborted"));
      if (!isAbort) {
        if (!clientDisconnected) {
          res.write(`data: [ERROR] AI service unavailable. Please try again later.\n\n`);
        }
        res.end();
        // Still persist any partial text we accumulated before the error
        if (assistantText) {
          await db.insert(chatMessagesTable).values({
            sessionId: params.data.sessionId,
            role: "assistant",
            text: assistantText,
          });
        }
        return;
      }
    }

    // Persist whatever text was accumulated (full response or partial on disconnect)
    if (assistantText) {
      await db.insert(chatMessagesTable).values({
        sessionId: params.data.sessionId,
        role: "assistant",
        text: assistantText,
      });
    }

    if (!clientDisconnected) {
      res.write("data: [DONE]\n\n");
    }
    res.end();
  } else {
    // ── Non-streaming JSON path (used by mobile and generated API client) ────
    if (historyTrimmed) {
      res.setHeader("X-History-Trimmed", "true");
    }
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
