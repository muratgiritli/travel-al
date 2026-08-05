import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { eq } from "drizzle-orm";
import { db, visaCountryOverridesTable } from "@workspace/db";
import OpenAI from "openai";

// Strip any non-ASCII characters (e.g. smart quotes accidentally pasted into the secret)
const openai = new OpenAI({ apiKey: (process.env.OPENAI_API_KEY || "").replace(/[^\x20-\x7E]/g, "").trim() });

const router: IRouter = Router();

// dist/index.mjs → dist/ → artifacts/api-server/ → data/visa/
const __dirname_compat = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname_compat, "..", "data", "visa");
const EXEMPT_PATH      = join(DATA_DIR, "visa-exempt-countries.json");
const EVISA_PATH       = join(DATA_DIR, "evisa-direct-countries.json");
const CONDITIONAL_PATH  = join(DATA_DIR, "evisa-conditional-countries.json");
const AGE_SPECIAL_PATH    = join(DATA_DIR, "age-special-countries.json");
const STICKER_PATH        = join(DATA_DIR, "sticker-mission-countries.json");
const OVERRIDES_PATH      = join(DATA_DIR, "country-overrides.json");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// ── Types ────────────────────────────────────────────────────────────────────

interface AgeBand { label: string; status: string; detail: string; }
interface RawCountry {
  id: string; name: string; name_tr?: string; iso2: string; flag_emoji: string;
  slug?: string;
  visa_summary?: string; stay_rule?: string; insurance_required?: boolean;
  admin_html_notes?: string; ai_extra_context?: string; is_active?: boolean;
  headline?: string; features?: string[];
  price_label?: string; price_example?: string; cta?: string; cta_href?: string;
  age_bands?: AgeBand[];
  precondition?: string;
}
interface ExemptFile       { defaults: Record<string, unknown>; countries: RawCountry[]; }
interface EvisaFile        { countries?: RawCountry[]; [k: string]: unknown; }
interface ConditionalFile  { defaults: Record<string, unknown>; countries: RawCountry[]; }
interface AgeSpecialFile    { defaults: Record<string, unknown>; countries: RawCountry[]; }
interface StickerFile      { defaults: Record<string, unknown>; countries: RawCountry[]; }
interface Override     {
  visa_summary?: string; stay_rule?: string; insurance_required?: boolean;
  admin_html_notes?: string; ai_extra_context?: string; is_active?: boolean;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const CONDITIONAL_DEFAULTS: Partial<RawCountry> = {
  insurance_required: true,
  headline: "Conditional e-Visa — prerequisite + insurance required",
  features: [
    "Schengen / USA / UK / Ireland visa or residence usually required",
    "Travel insurance is mandatory",
    "Apply here — no redirect to evisa.gov.tr",
  ],
  price_label: "Next step: verify eligibility + apply",
  price_example: "Tap APPLY NOW to continue.",
  cta: "APPLY NOW",
  cta_href: "/next",
};

const EVISA_DEFAULTS: Partial<RawCountry> = {
  insurance_required: true,
  headline: "You need an e-Visa + mandatory travel insurance for Türkiye",
  features: [
    "🔵 e-Visa required for entry",
    "🛡️ Travel insurance mandatory for your stay",
    "✅ Fast approval — typically within 24 hours",
  ],
  price_label: "from €14.99",
  price_example: "14-day single-entry e-Visa + insurance",
  cta: "APPLY NOW",
  cta_href: "/next",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return fallback; }
}
function sanitize(html: string): string {
  return String(html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

// ── DB override helpers ───────────────────────────────────────────────────────

/** Load all overrides from the DB, keyed by country_id.
 *  Falls back to the JSON file when the DB is unavailable. */
async function loadDbOverrides(): Promise<Record<string, Override>> {
  try {
    const rows = await db.select().from(visaCountryOverridesTable);
    const map: Record<string, Override> = {};
    for (const row of rows) {
      map[row.countryId] = {
        visa_summary:       row.visaSummary        ?? undefined,
        stay_rule:          row.stayRule            ?? undefined,
        insurance_required: row.insuranceRequired   ?? undefined,
        admin_html_notes:   row.adminHtmlNotes      ?? undefined,
        ai_extra_context:   row.aiExtraContext       ?? undefined,
        is_active:          row.isActive            ?? undefined,
      };
    }
    return map;
  } catch (err) {
    console.error("[visa] Failed to load overrides from DB, falling back to JSON file:", err);
    return readJson<Record<string, Override>>(OVERRIDES_PATH, {});
  }
}

/** Upsert a single country override into the DB. */
async function upsertDbOverride(countryId: string, override: Override): Promise<void> {
  await db
    .insert(visaCountryOverridesTable)
    .values({
      countryId,
      visaSummary:       override.visa_summary       ?? null,
      stayRule:          override.stay_rule          ?? null,
      insuranceRequired: override.insurance_required ?? null,
      adminHtmlNotes:    override.admin_html_notes   ?? null,
      aiExtraContext:    override.ai_extra_context    ?? null,
      isActive:          override.is_active          ?? null,
      updatedAt:         new Date(),
    })
    .onConflictDoUpdate({
      target: visaCountryOverridesTable.countryId,
      set: {
        visaSummary:       override.visa_summary       ?? null,
        stayRule:          override.stay_rule          ?? null,
        insuranceRequired: override.insurance_required ?? null,
        adminHtmlNotes:    override.admin_html_notes   ?? null,
        aiExtraContext:    override.ai_extra_context    ?? null,
        isActive:          override.is_active          ?? null,
        updatedAt:         new Date(),
      },
    });
}

/** On first start, migrate any overrides from the JSON file into the DB. */
let migrationDone = false;
async function migrateJsonOverridesToDb(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;
  try {
    const jsonOverrides = readJson<Record<string, Override>>(OVERRIDES_PATH, {});
    const ids = Object.keys(jsonOverrides);
    if (ids.length === 0) return;

    // Only seed DB entries that don't exist yet
    const existing = await db
      .select({ countryId: visaCountryOverridesTable.countryId })
      .from(visaCountryOverridesTable);
    const existingIds = new Set(existing.map((r) => r.countryId));

    for (const id of ids) {
      if (!existingIds.has(id)) {
        await upsertDbOverride(id, jsonOverrides[id]);
      }
    }
    if (ids.length > 0) {
      console.log(`[visa] Migrated ${ids.filter((id) => !existingIds.has(id)).length} override(s) from JSON to DB`);
    }
  } catch (err) {
    console.error("[visa] Override migration failed (non-fatal):", err);
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadAll() {
  await migrateJsonOverridesToDb();
  const overrides = await loadDbOverrides();

  const exemptFile  = readJson<ExemptFile>(EXEMPT_PATH, { defaults: {}, countries: [] });
  const evisaFile   = readJson<EvisaFile>(EVISA_PATH,  { countries: [] });
  const exemptDefs  = exemptFile.defaults || {};

  const exempt = (exemptFile.countries || []).map((c) => {
    const o = overrides[c.id] || {};
    return {
      ...exemptDefs, ...c, ...o,
      category: "visa_exempt" as const,
      insurance_required: o.insurance_required ?? c.insurance_required ?? true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: (c as RawCountry).cta ?? (exemptDefs as unknown as RawCountry).cta ?? "Get travel insurance",
      cta_href: "/checkout",
    };
  });

  const evisaRaw = Array.isArray(evisaFile) ? evisaFile : evisaFile.countries || [];
  const evisa = (evisaRaw as RawCountry[]).map((c) => {
    const o = overrides[c.id] || {};
    return {
      ...EVISA_DEFAULTS, ...c, ...o,
      category: "evisa_direct" as const,
      insurance_required: o.insurance_required ?? c.insurance_required ?? true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: "APPLY NOW",
      cta_href: "/next",
    };
  });

  const condFile  = readJson<ConditionalFile>(CONDITIONAL_PATH, { defaults: {}, countries: [] });
  const condDefs  = condFile.defaults || {};
  const conditional = (condFile.countries || []).map((c) => {
    const o = overrides[c.id] || {};
    return {
      ...CONDITIONAL_DEFAULTS, ...condDefs, ...c, ...o,
      category: "evisa_conditional" as const,
      insurance_required: true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? (c as { is_active?: boolean }).is_active ?? true,
      cta: "APPLY NOW",
      cta_href: `/apply/${c.id}`,
      precondition: o.visa_summary
        ? undefined
        : (c as { precondition?: string }).precondition ?? (condDefs as { precondition?: string }).precondition,
    };
  });

  // age_special
  const ageFile = readJson<AgeSpecialFile>(AGE_SPECIAL_PATH, { defaults: {}, countries: [] });
  const ageDefs = ageFile.defaults || {};
  const ageSpecial = (ageFile.countries || []).map((c) => {
    const o = overrides[c.id] || {};
    return {
      ...ageDefs, ...c, ...o,
      category: "age_special" as const,
      insurance_required: true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: "APPLY NOW",
      cta_href: `/apply/${c.slug || c.id}`,
      age_bands: c.age_bands || [],
    };
  });

  // sticker_mission
  const stickerFile = readJson<StickerFile>(STICKER_PATH, { defaults: {}, countries: [] });
  const stickerDefs = stickerFile.defaults || {};
  const sticker = (stickerFile.countries || []).map((c) => {
    const o = overrides[c.id] || {};
    return {
      ...stickerDefs, ...c, ...o,
      category: "sticker_mission" as const,
      insurance_required: true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: "APPLY NOW",
      cta_href: `/apply/${c.slug || c.id}`,
    };
  });

  return [...exempt, ...evisa, ...conditional, ...ageSpecial, ...sticker];
}

async function getCountry(idOrIso: string) {
  const key = String(idOrIso || "").toLowerCase();
  const all = await loadAll();
  return all.find(
    (c) =>
      c.id === key ||
      c.iso2.toLowerCase() === key ||
      c.name.toLowerCase() === key ||
      ((c as RawCountry).slug || "").toLowerCase() === key,
  );
}

function buildCard(country: Awaited<ReturnType<typeof getCountry>>) {
  if (!country) return null;
  return {
    country: country.name,
    name_tr: (country as { name_tr?: string }).name_tr,
    iso2: country.iso2,
    flag_emoji: country.flag_emoji,
    category: country.category,
    visa_status: (country as { visa_summary?: string }).visa_summary || "",
    insurance_required: !!(country as { insurance_required?: boolean }).insurance_required,
    headline: (country as { headline?: string }).headline || "",
    body: [
      (country as { stay_rule?: string }).stay_rule || "",
      "Travel health insurance is mandatory for the full duration of your stay.",
    ],
    features: (country as { features?: string[] }).features || [],
    price_label: (country as { price_label?: string }).price_label || "",
    price_example: (country as { price_example?: string }).price_example || "",
    cta: (country as { cta?: string }).cta || "Continue",
    cta_href: (country as { cta_href?: string }).cta_href || "/checkout",
    admin_html_notes: (country as { admin_html_notes?: string }).admin_html_notes || "",
    ai_extra_context: (country as { ai_extra_context?: string }).ai_extra_context || "",
  };
}

// ── User-facing wording sanitizer: "visa" → "permit" terminology ─────────────
const DEPERMIT_SKIP_KEYS = new Set(["category", "status", "id", "slug", "iso2", "cta_href", "flag_emoji"]);

function depermitText(s: string): string {
  return s
    .replace(/(^|[^\p{L}\d])e[- ]?visas/giu, "$1e-Permits")
    .replace(/(^|[^\p{L}\d])e[- ]?visa/giu, "$1e-Permit")
    .replace(/\bvisa[- ]free\b/gi, "permit-free")
    .replace(/\bvisa exempt\b/gi, "Permit-free entry")
    .replace(/\bvisas\b/gi, (m) => (m[0] === "V" ? "Permits" : "permits"))
    .replace(/\bvisa\b/gi, (m) => (m[0] === "V" ? "Permit" : "permit"));
}

function depermitDeep<T>(v: T, key?: string): T {
  if (typeof v === "string") return (key && DEPERMIT_SKIP_KEYS.has(key) ? v : depermitText(v)) as T;
  if (Array.isArray(v)) return v.map((x) => depermitDeep(x)) as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = depermitDeep(val, k);
    return out as T;
  }
  return v;
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers["x-admin-password"] as string) || (req.query.password as string);
  if (token !== ADMIN_PASSWORD) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

// ── Public routes ─────────────────────────────────────────────────────────────

router.get("/travel/countries", async (_req, res) => {
  try {
    const countries = (await loadAll())
      .filter((c) => (c as { is_active?: boolean }).is_active !== false)
      .map((c) => ({
        id: c.id, name: c.name, name_tr: (c as { name_tr?: string }).name_tr,
        iso2: c.iso2, flag_emoji: c.flag_emoji,
        category: c.category,
        visa_summary: (c as { visa_summary?: string }).visa_summary,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(depermitDeep({ count: countries.length, countries }));
  } catch (err) {
    console.error("[visa] GET /visa/countries error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/travel/countries/:id", async (req, res) => {
  try {
    const country = await getCountry(req.params.id);
    if (!country) { res.status(404).json({ error: "Country not found" }); return; }
    res.json(depermitDeep({ country, card: buildCard(country) }));
  } catch (err) {
    console.error("[visa] GET /visa/countries/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/travel/chat", async (req, res) => {
  try {
    const { countryId, message, history } = req.body || {};
    const country = await getCountry(countryId);
    if (!country) {
      res.status(400).json({ reply_text: "Please select your passport country first.", card: null });
      return;
    }
    const card = depermitDeep(buildCard(country));

    // Build a grounded system prompt from the country's visa card data
    const c = country as {
      name: string; category: string; visa_summary?: string; stay_rule?: string;
      insurance_required?: boolean; headline?: string; features?: string[];
      price_label?: string; ai_extra_context?: string;
    };
    const categoryLabel =
      c.category === "visa_exempt" ? "visa-exempt"
      : c.category === "evisa_direct" ? "requires a direct e-Visa"
      : c.category === "evisa_conditional" ? "may be eligible for a conditional e-Visa"
      : c.category === "age_special" ? "has age-specific visa rules"
      : "requires a sticker visa obtained from a Turkish mission";

    const factLines = [
      `Country: ${c.name}`,
      `Visa category for Türkiye: ${categoryLabel}`,
      c.visa_summary ? `Visa summary: ${c.visa_summary}` : null,
      c.stay_rule ? `Stay rule: ${c.stay_rule}` : null,
      `Travel insurance required: ${c.insurance_required ? "Yes — mandatory" : "Not mandatory"}`,
      c.headline ? `Headline: ${c.headline}` : null,
      c.features?.length ? `Key features:\n${c.features.map(f => `  - ${f}`).join("\n")}` : null,
      c.price_label ? `Pricing: ${c.price_label}` : null,
      c.ai_extra_context ? `Additional context:\n${c.ai_extra_context}` : null,
    ].filter(Boolean).join("\n");

    const systemPrompt =
      `You are a knowledgeable and friendly Türkiye visa assistant. ` +
      `Answer questions about travelling to Türkiye for ${c.name} passport holders. ` +
      `Base your answers strictly on the following verified data — do not invent rules that are not listed:\n\n` +
      `${factLines}\n\n` +
      `If asked something outside Türkiye entry or travel topics, politely redirect the user. ` +
      `IMPORTANT: never use the word "visa" in your replies — always say "e-Permit", "entry permit", or "travel authorization" instead (e.g. "e-Permit" instead of "e-Visa", "permit-free" instead of "visa-free"). ` +
      `Keep answers concise, factual, and helpful. Use plain text (no markdown headers).`;

    // Build conversation history for context
    const priorMessages: OpenAI.Chat.ChatCompletionMessageParam[] = Array.isArray(history)
      ? history
          .filter((m: { role?: string; text?: string }) => m.role === "user" || m.role === "assistant" || m.role === "bot")
          .map((m: { role: string; text: string }) => ({
            role: (m.role === "bot" ? "assistant" : m.role) as "user" | "assistant",
            content: m.text,
          }))
      : [];

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...priorMessages,
      { role: "user", content: String(message || "") },
    ];

    const wantsStream = req.headers.accept?.includes("text/event-stream") ?? false;

    if (wantsStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      // Send card as first SSE event so the client can render it immediately
      res.write(`data: [CARD]${JSON.stringify(card)}\n\n`);
      res.flushHeaders();

      let assistantText = "";
      // Buffer tokens and flush on whitespace boundaries so the "visa"→"permit"
      // sanitizer never misses a word split across stream chunks.
      let pendingRaw = "";
      const flushPending = (all = false): string => {
        if (all) { const out = depermitText(pendingRaw); pendingRaw = ""; return out; }
        const idx = pendingRaw.search(/\s\S*$/);
        if (idx < 0) return "";
        const safe = pendingRaw.slice(0, idx + 1);
        pendingRaw = pendingRaw.slice(idx + 1);
        return depermitText(safe);
      };
      let clientDisconnected = false;
      let openaiStream: Awaited<ReturnType<typeof openai.chat.completions.create>> & { controller?: AbortController } | null = null;

      req.on("close", () => {
        clientDisconnected = true;
        if (openaiStream && "controller" in openaiStream && openaiStream.controller) {
          openaiStream.controller.abort();
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
            pendingRaw += token;
            const safe = flushPending();
            if (safe) {
              const escaped = safe.replace(/\n/g, "\\n");
              res.write(`data: ${escaped}\n\n`);
            }
          }
        }
        if (!clientDisconnected) {
          const rest = flushPending(true);
          if (rest) res.write(`data: ${rest.replace(/\n/g, "\\n")}\n\n`);
        }
      } catch (err: unknown) {
        const isAbort =
          err instanceof Error && (err.name === "AbortError" || err.message?.includes("aborted"));
        if (!isAbort && !clientDisconnected) {
          res.write(`data: [ERROR] AI service unavailable. Please try again later.\n\n`);
        }
        res.end();
        return;
      }

      if (!clientDisconnected) {
        res.write("data: [DONE]\n\n");
      }
      res.end();
    } else {
      // Non-streaming JSON fallback
      let reply_text: string;
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 1024,
          messages: chatMessages,
        });
        reply_text = depermitText(completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.");
      } catch (err) {
        console.error("[visa] OpenAI error:", err);
        res.status(502).json({ error: "AI service unavailable. Please try again later." });
        return;
      }
      res.json({ reply_text, card });
    }
  } catch (err) {
    console.error("[visa] POST /visa/chat error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin routes ──────────────────────────────────────────────────────────────

router.get("/travel/admin/countries", requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;
    let countries = (await loadAll()).sort((a, b) => a.name.localeCompare(b.name));
    if (category === "visa_exempt" || category === "evisa_direct") {
      countries = countries.filter((c) => c.category === category);
    }
    res.json({ countries });
  } catch (err) {
    console.error("[visa] GET /visa/admin/countries error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/travel/admin/countries/:id", requireAdmin, async (req, res) => {
  try {
    const country = await getCountry(String(req.params.id));
    if (!country) { res.status(404).json({ error: "Country not found" }); return; }
    res.json({ country, card: buildCard(country) });
  } catch (err) {
    console.error("[visa] GET /visa/admin/countries/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/travel/admin/countries/:id", requireAdmin, async (req, res) => {
  try {
    const country = await getCountry(String(req.params.id));
    if (!country) { res.status(404).json({ error: "Country not found" }); return; }

    // Load the current DB override (if any) as the baseline
    const existing = await db
      .select()
      .from(visaCountryOverridesTable)
      .where(eq(visaCountryOverridesTable.countryId, country.id))
      .limit(1);
    const prev: Override = existing.length > 0
      ? {
          visa_summary:       existing[0].visaSummary        ?? undefined,
          stay_rule:          existing[0].stayRule            ?? undefined,
          insurance_required: existing[0].insuranceRequired   ?? undefined,
          admin_html_notes:   existing[0].adminHtmlNotes      ?? undefined,
          ai_extra_context:   existing[0].aiExtraContext       ?? undefined,
          is_active:          existing[0].isActive            ?? undefined,
        }
      : {};

    const body = req.body || {};
    const updated: Override = {
      visa_summary:       body.visa_summary      ?? prev.visa_summary,
      stay_rule:          body.stay_rule          ?? prev.stay_rule,
      insurance_required: body.insurance_required ?? prev.insurance_required,
      admin_html_notes:   body.admin_html_notes   ?? prev.admin_html_notes ?? "",
      ai_extra_context:   body.ai_extra_context   ?? prev.ai_extra_context ?? "",
      is_active:          body.is_active          ?? prev.is_active,
    };

    await upsertDbOverride(country.id, updated);

    const updatedCountry = await getCountry(country.id);
    res.json({ ok: true, country: updatedCountry, card: buildCard(updatedCountry) });
  } catch (err) {
    console.error("[visa] PUT /visa/admin/countries/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
