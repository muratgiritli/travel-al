import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
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
    .orderBy(chatMessagesTable.createdAt);

  res.json(GetChatMessagesResponse.parse(messages));
});

// POST /chat/session/:sessionId/messages — send a message and get AI reply
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

  // Generate assistant response
  const assistantText = generateTravelResponse(parsed.data.text, session.passportCountryCode);

  const [assistantMessage] = await db
    .insert(chatMessagesTable)
    .values({
      sessionId: params.data.sessionId,
      role: "assistant",
      text: assistantText,
    })
    .returning();

  res.status(201).json(SendChatMessageResponse.parse(assistantMessage));
});

function generateTravelResponse(userText: string, passportCountryCode: string): string {
  const lower = userText.toLowerCase();

  if (lower.includes("visa") || lower.includes("entry")) {
    const visaFreeCountries = ["DE", "FR", "GB", "US", "CA", "AU", "JP", "KR", "NZ", "NL", "BE", "SE", "NO", "DK", "FI", "CH", "AT", "IT", "ES", "PT"];
    if (visaFreeCountries.includes(passportCountryCode)) {
      return `Great news! As a ${passportCountryCode} passport holder, you can visit Turkey visa-free for up to 90 days within a 180-day period. You only need a valid passport. Would you like to know about customs rules, what to pack, or top destinations?`;
    }
    return `As a ${passportCountryCode} passport holder, you will need an e-Visa to enter Turkey. You can apply online at evisa.gov.tr — it typically takes a few minutes and costs around $50. The visa allows a 90-day stay. Would you like help with the application process or other travel tips?`;
  }

  if (lower.includes("istanbul")) {
    return "Istanbul is a must-visit! Top highlights include the Hagia Sophia, Blue Mosque, Grand Bazaar, Topkapi Palace, and a Bosphorus cruise. The city straddles two continents — you can literally walk from Europe to Asia. I recommend staying at least 3–4 days. Would you like hotel or neighborhood recommendations?";
  }

  if (lower.includes("cappadocia") || lower.includes("kapadokya")) {
    return "Cappadocia is magical — famous for its hot air balloon rides at sunrise, fairy chimneys, underground cities, and cave hotels. The best time to visit is April–June or September–November for pleasant weather. I recommend staying in Göreme or Ürgüp. Would you like activity or accommodation suggestions?";
  }

  if (lower.includes("hotel") || lower.includes("accommodation") || lower.includes("stay")) {
    return "Turkey has excellent accommodation options for every budget. In Istanbul, Sultanahmet and Beyoglu are popular areas. In Cappadocia, cave hotels are a unique experience. In coastal areas like Antalya or Bodrum, luxury resorts abound. What is your preferred location and budget range?";
  }

  if (lower.includes("food") || lower.includes("eat") || lower.includes("restaurant") || lower.includes("cuisine")) {
    return "Turkish cuisine is incredible! Must-tries include kebabs, meze, baklava, simit, lahmacun, and of course Turkish tea and coffee. In Istanbul, explore Karakoy for trendy cafes, Beyoglu for restaurants, and the Egyptian Bazaar for spices. Do you have any dietary restrictions I should know about?";
  }

  if (lower.includes("weather") || lower.includes("when") || lower.includes("best time")) {
    return "The best time to visit Turkey depends on the region. For Istanbul and the Aegean/Mediterranean coasts, April–June and September–October offer perfect weather. July–August is peak season and very hot. Cappadocia is beautiful year-round, though winter can be cold. When are you planning to travel?";
  }

  if (lower.includes("money") || lower.includes("currency") || lower.includes("cost")) {
    return "Turkey uses the Turkish Lira (TRY). Credit cards are widely accepted in cities and tourist areas. ATMs are readily available. Turkey is generally affordable for tourists — a mid-range meal costs around 150–300 TRY. I recommend exchanging money at official exchange offices (döviz bürosu) for better rates. Do you need a rough budget estimate for your trip?";
  }

  if (lower.includes("transport") || lower.includes("flight") || lower.includes("get around")) {
    return "Getting around Turkey is straightforward. Istanbul has an excellent metro, tram, and ferry system. Between cities, Turkish Airlines, Pegasus, and SunExpress offer affordable domestic flights. Intercity buses (especially Metro Turizm) are comfortable and frequent. Rent a car for exploring rural Cappadocia or the coast. What cities are you planning to visit?";
  }

  return `That's a great question about Turkey! I can help with visa requirements for ${passportCountryCode} passport holders, destinations like Istanbul, Cappadocia, Ephesus, or Antalya, accommodation, food, transport, budgeting, and cultural tips. What would you like to know more about?`;
}

export default router;
