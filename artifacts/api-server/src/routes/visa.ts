import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { eq } from "drizzle-orm";
import { db, visaCountryOverridesTable } from "@workspace/db";
import OpenAI from "openai";
import sanitizeHtml from "sanitize-html";
import {
  getSettings, putSetting, SETTINGS_KEYS, DEFAULT_SETTINGS,
  type OptionCardDef, type SiteSettings,
  getAdminAuth, setAdminCredentials, verifyAdminLogin, verifyAdminPassword,
  createSessionToken, verifySessionToken, parseCookies,
} from "../lib/siteSettings";
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  updateOrderNote,
  ORDER_STATUSES,
  type OrderStatus,
  type OrderType,
} from "../lib/ordersStore";

// Prefer the Replit AI Integrations proxy (no user API key / credits needed);
// fall back to a direct OpenAI key if the proxy env vars are missing.
const openai = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  ? new OpenAI({
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "",
    })
  : new OpenAI({ apiKey: (process.env.OPENAI_API_KEY || "").replace(/[^\x20-\x7E]/g, "").trim() });

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
  /** Flexible admin-editable fields (names, slug, category, precondition,
   *  age_bands, airline_conditions, mission_note, option_cards, pricing…). */
  extra?: Record<string, unknown>;
}

const VALID_CATEGORIES = ["visa_exempt", "evisa_direct", "evisa_conditional", "age_special", "sticker_mission"] as const;

/** Fields the admin may store in the `extra` JSON blob. */
const EXTRA_FIELDS = [
  "name", "name_tr", "iso2", "flag_emoji", "slug", "category",
  "precondition", "age_bands", "airline_conditions", "mission_note",
  "headline", "features", "price_label", "price_example", "cta", "cta_href",
  "option_cards", "pricing_override",
  // Top-block content (badges + title + requirements card shown first in chat)
  "badge_country_label", "top_title", "top_subtitle", "support_line",
  "requirements_title", "passport_validity_text", "max_stay_text", "insurance_label",
  "sort_order",
] as const;

/** Apply the extra JSON override fields onto a merged country object. */
function applyExtra<T extends Record<string, unknown>>(base: T, o: Override): T {
  const extra = o.extra;
  if (!extra || typeof extra !== "object") return base;
  const out: Record<string, unknown> = { ...base };
  for (const f of EXTRA_FIELDS) {
    if (extra[f] === undefined || extra[f] === null) continue;
    if (f === "category" && !VALID_CATEGORIES.includes(extra[f] as typeof VALID_CATEGORIES[number])) continue;
    if (f === "cta_href" && !String(extra[f]).startsWith("/")) continue; // internal links only
    out[f] = f === "mission_note" || f === "precondition" ? String(extra[f]) : extra[f];
  }
  return out as T;
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const CONDITIONAL_DEFAULTS: Partial<RawCountry> = {
  insurance_required: true,
  headline: "Turkey E-visa Information",
  features: [
    "Schengen / USA / UK / Ireland visa or residence usually required",
    "Travel insurance is mandatory",
    "Apply here — no external redirects",
  ],
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
  return sanitizeHtml(String(html || ""), {
    allowedTags: [
      "p", "br", "b", "strong", "i", "em", "u", "s", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "a", "span", "div",
      "table", "thead", "tbody", "tr", "th", "td", "hr",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

// ── DB override helpers ───────────────────────────────────────────────────────

/** Load all overrides from the DB, keyed by country_id.
 *  Falls back to the JSON file when the DB is unavailable. */
async function loadDbOverrides(): Promise<Record<string, Override>> {
  try {
    const rows = await db.select().from(visaCountryOverridesTable);
    const map: Record<string, Override> = {};
    for (const row of rows) {
      // IMPORTANT: only include keys that actually have a value. A key set to
      // `undefined` would still be spread over the seed data (`{ ...c, ...o }`)
      // and clobber the seed value with `undefined`.
      const o: Override = {};
      if (row.visaSummary != null)      o.visa_summary = row.visaSummary;
      if (row.stayRule != null)         o.stay_rule = row.stayRule;
      if (row.insuranceRequired != null) o.insurance_required = row.insuranceRequired;
      if (row.adminHtmlNotes != null)   o.admin_html_notes = row.adminHtmlNotes;
      if (row.aiExtraContext != null)   o.ai_extra_context = row.aiExtraContext;
      if (row.isActive != null)         o.is_active = row.isActive;
      if (row.extra != null)            o.extra = row.extra as Record<string, unknown>;
      map[row.countryId] = o;
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
      extra:             override.extra              ?? null,
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
        extra:             override.extra              ?? null,
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
    return applyExtra({
      ...exemptDefs, ...c, ...o,
      category: "visa_exempt" as const,
      insurance_required: o.insurance_required ?? c.insurance_required ?? true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: (c as RawCountry).cta ?? (exemptDefs as unknown as RawCountry).cta ?? "Get travel insurance",
      cta_href: "/checkout",
    }, o);
  });

  const evisaRaw = Array.isArray(evisaFile) ? evisaFile : evisaFile.countries || [];
  const evisa = (evisaRaw as RawCountry[]).map((c) => {
    const o = overrides[c.id] || {};
    return applyExtra({
      ...EVISA_DEFAULTS, ...c, ...o,
      category: "evisa_direct" as const,
      insurance_required: o.insurance_required ?? c.insurance_required ?? true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: "APPLY NOW",
      cta_href: "/next",
    }, o);
  });

  const condFile  = readJson<ConditionalFile>(CONDITIONAL_PATH, { defaults: {}, countries: [] });
  const condDefs  = condFile.defaults || {};
  const conditional = (condFile.countries || []).map((c) => {
    const o = overrides[c.id] || {};
    return applyExtra({
      ...CONDITIONAL_DEFAULTS, ...condDefs, ...c, ...o,
      category: "evisa_conditional" as const,
      insurance_required: true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? (c as { is_active?: boolean }).is_active ?? true,
      cta: "APPLY NOW",
      cta_href: "/next",
      precondition: o.visa_summary
        ? undefined
        : (c as { precondition?: string }).precondition ?? (condDefs as { precondition?: string }).precondition,
    }, o);
  });

  // age_special
  const ageFile = readJson<AgeSpecialFile>(AGE_SPECIAL_PATH, { defaults: {}, countries: [] });
  const ageDefs = ageFile.defaults || {};
  const ageSpecial = (ageFile.countries || []).map((c) => {
    const o = overrides[c.id] || {};
    return applyExtra({
      ...ageDefs, ...c, ...o,
      category: "age_special" as const,
      insurance_required: true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: "APPLY NOW",
      cta_href: "/next",
      age_bands: c.age_bands || [],
    }, o);
  });

  // sticker_mission
  const stickerFile = readJson<StickerFile>(STICKER_PATH, { defaults: {}, countries: [] });
  const stickerDefs = stickerFile.defaults || {};
  const sticker = (stickerFile.countries || []).map((c) => {
    const o = overrides[c.id] || {};
    return applyExtra({
      ...stickerDefs, ...c, ...o,
      category: "sticker_mission" as const,
      insurance_required: true,
      admin_html_notes: sanitize(o.admin_html_notes ?? c.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
      cta: "APPLY NOW",
      cta_href: "/next",
    }, o);
  });

  const all = [...exempt, ...evisa, ...conditional, ...ageSpecial, ...sticker];

  // Admin-created countries (exist only as DB overrides with extra.category)
  const seedIds = new Set(all.map((c) => c.id));
  for (const [id, o] of Object.entries(overrides)) {
    const extra = o.extra as Record<string, unknown> | undefined;
    if (seedIds.has(id) || !extra || !extra.category || !extra.name) continue;
    all.push(applyExtra({
      id,
      name: String(extra.name),
      iso2: String(extra.iso2 || id).toUpperCase(),
      flag_emoji: String(extra.flag_emoji || "🏳️"),
      category: "evisa_direct",
      visa_summary: o.visa_summary ?? "",
      stay_rule: o.stay_rule ?? "",
      insurance_required: o.insurance_required ?? true,
      admin_html_notes: sanitize(o.admin_html_notes ?? ""),
      ai_extra_context: o.ai_extra_context ?? "",
      is_active: o.is_active ?? true,
      cta: "APPLY NOW",
      cta_href: "/next",
    } as unknown as Record<string, unknown>, o) as unknown as (typeof all)[number]);
  }

  return all;
}

async function getCountry(idOrIso: string) {
  const key = String(idOrIso || "").toLowerCase();
  const all = await loadAll();
  return all.find(
    (c) =>
      c.id === key ||
      c.iso2.toLowerCase() === key ||
      c.name.toLowerCase() === key ||
      c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === key ||
      ((c as RawCountry).slug || "").toLowerCase() === key,
  );
}

/** Strip any year (e.g. "2026") from the requirements title — years are forbidden. */
function stripYear(s: string): string {
  return s.replace(/\s*\(?\b20\d{2}\b\)?\s*/g, " ").replace(/\s+:/g, ":").replace(/\s{2,}/g, " ").trim();
}

function buildCard(country: Awaited<ReturnType<typeof getCountry>>) {
  if (!country) return null;
  const x = country as Record<string, unknown>;
  const str = (k: string) => (typeof x[k] === "string" ? (x[k] as string) : "");
  return {
    top_block: {
      badge_country_label: str("badge_country_label") || country.name.toUpperCase(),
      // All countries: always show E-VISA (never "Authorization")
      title: "Get Your Travel E-VISA",
      subtitle: str("top_subtitle") || `for ${country.name} Citizens`,
      support_line: str("support_line"),
      requirements_title: stripYear(str("requirements_title")) || "Travel Requirements for Turkey:",
      passport_validity_text: str("passport_validity_text") || "Minimum 180 days",
      max_stay_text: str("max_stay_text"),
      insurance_label: str("insurance_label") || "Required",
    },
    country: country.name,
    name_tr: (country as { name_tr?: string }).name_tr,
    iso2: country.iso2,
    flag_emoji: country.flag_emoji,
    category: country.category,
    visa_status: (country as { visa_summary?: string }).visa_summary || "",
    insurance_required: !!(country as { insurance_required?: boolean }).insurance_required,
    fee_free: !!(country as { fee_free?: boolean }).fee_free,
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
// "title" (top-block başlığı) atlanır: kullanıcı isteğiyle "E-Visa" burada aynen görünmeli.
const DEPERMIT_SKIP_KEYS = new Set(["category", "status", "id", "slug", "iso2", "cta_href", "flag_emoji", "title"]);

function depermitText(s: string): string {
  return s
    // User request: "Authorization" → "E-VISA" (all countries / all copy)
    .replace(/\b[Tt]ravel [Aa]uthorization\b/g, "E-VISA")
    .replace(/\b[Aa]uthorization\b/g, "E-VISA")
    // User request: GCC option title (all countries)
    .replace(/Holiday Entry\s*[—\-]\s*GCC Residence/gi, "Turkey Visa - GCC Residence")
    // User request: Option 4 sticker title
    .replace(/\bSticker Permit Consultancy\b(?!\s+Service)/gi, "Turkey Visa")
    // User request: conditional headline
    .replace(/Conditional e-Visa\s*[—\-]\s*prerequisite \+ insurance required/gi, "Turkey E-visa Information")
    // Protect E-VISA / e-Visa before generic visa→permit rewrite
    .replace(/(^|[^\p{L}\d])e[- ]?visas/giu, "$1\uE000E-VISAs\uE001")
    .replace(/(^|[^\p{L}\d])e[- ]?visa/giu, "$1\uE000E-VISA\uE001")
    .replace(/\bvisa[- ]free\b/gi, "permit-free")
    .replace(/\bvisa exempt\b/gi, "Permit-free entry")
    .replace(/\bvisas\b/gi, (m) => (m[0] === "V" ? "Permits" : "permits"))
    .replace(/\bvisa\b/gi, (m) => (m[0] === "V" ? "Permit" : "permit"))
    .replace(/\bpermit-free entry\b/gi, "E-VISA free entry")
    .replace(/\uE000/g, "")
    .replace(/\uE001/g, "");
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
  // 1) Session cookie set by /travel/admin/login
  const cookies = parseCookies(req.headers.cookie);
  if (verifySessionToken(cookies["tta_admin"])) { next(); return; }
  // 2) Legacy password header (verified against stored credentials)
  const legacy = (req.headers["x-admin-password"] as string) || "";
  if (legacy) {
    verifyAdminPassword(legacy)
      .then((ok) => (ok ? next() : res.status(401).json({ error: "Unauthorized" })))
      .catch(() => res.status(401).json({ error: "Unauthorized" }));
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

/** Validate a pricing_override payload: every numeric field must be a finite,
 *  non-negative number. Returns an error message, or null when valid. */
function validatePricingOverride(po: unknown): string | null {
  if (po === undefined || po === null) return null;
  if (typeof po !== "object" || Array.isArray(po)) return "pricing_override must be an object";
  for (const [group, values] of Object.entries(po as Record<string, unknown>)) {
    if (values === undefined || values === null) continue;
    if (typeof values !== "object" || Array.isArray(values)) return `pricing_override.${group} must be an object`;
    for (const [key, val] of Object.entries(values as Record<string, unknown>)) {
      if (val === undefined || val === null) continue;
      if (key === "currency") {
        if (typeof val !== "string" || !/^[A-Za-z]{3}$/.test(val)) {
          return `pricing_override.${group}.currency must be a 3-letter currency code`;
        }
        continue;
      }
      const n = typeof val === "number" ? val : Number(val);
      if (typeof val === "boolean" || !Number.isFinite(n) || n < 0) {
        return `pricing_override.${group}.${key} must be a non-negative number (got "${String(val)}")`;
      }
      (values as Record<string, unknown>)[key] = n;
    }
  }
  return null;
}

// ── Pricing / option-card resolution ─────────────────────────────────────────

type AnyCountry = Record<string, unknown>;

function effectivePricing(settings: SiteSettings, country: AnyCountry) {
  const base = settings.pricing;
  const over = ((country.pricing_override as Record<string, unknown>) || {}) as {
    insurance?: Partial<SiteSettings["pricing"]["insurance"]>;
    fees?: Partial<SiteSettings["pricing"]["fees"]>;
  };
  return {
    insurance: { ...base.insurance, ...(over.insurance || {}) },
    fees: { ...base.fees, ...(over.fees || {}) },
  };
}

function enrichAgeDirectCard(card: OptionCardDef, country: AnyCountry): OptionCardDef {
  if (card.id !== "age-direct") return card;
  const bands = (country.age_bands as Array<{ label?: string; status?: string; detail?: string }> | undefined) || [];
  const band = bands.find((b) => b.status === "direct_evisa") || bands[0];
  if (!band?.label) {
    return {
      ...card,
      require_age_confirm: card.require_age_confirm ?? true,
    };
  }
  return {
    ...card,
    description: card.description || `${band.label} — direct online e-Permit.`,
    require_age_confirm: true,
    age_confirm_info:
      card.age_confirm_info ||
      `${band.label} can apply for a direct e-Permit without additional permit conditions.`,
    age_confirm_question:
      card.age_confirm_question || `Are you in this age group (${band.label})?`,
  };
}

function effectiveOptionCards(settings: SiteSettings, country: AnyCountry): OptionCardDef[] {
  const own = country.option_cards as OptionCardDef[] | undefined;
  const category = String(country.category) as keyof SiteSettings["option_card_defaults"];
  const cards = (own && own.length > 0 ? own : settings.option_card_defaults[category]) || [];
  const currency = effectivePricing(settings, country).fees.currency;
  return [...cards]
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((c) => enrichAgeDirectCard({ ...c, currency: c.currency || currency }, country));
}

/** Public-safe settings subset (never expose admin credentials). */
function publicSettings(s: SiteSettings) {
  return {
    pricing: s.pricing,
    chat: s.chat,
    content: s.content,
    apply: s.apply,
    brand: s.brand,
    esim: s.esim,
    trust: s.trust,
  };
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
    // Unpublished countries are hidden from the public (admin routes still see them)
    if (!country || (country as { is_active?: boolean }).is_active === false) {
      res.status(404).json({ error: "Country not found" });
      return;
    }
    const settings = await getSettings();
    const c = country as unknown as AnyCountry;
    res.json(depermitDeep({
      country,
      card: buildCard(country),
      option_cards: effectiveOptionCards(settings, c).filter((oc) => oc.active !== false),
      pricing: effectivePricing(settings, c),
    }));
  } catch (err) {
    console.error("[visa] GET /visa/countries/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public site settings (brand, chat copy, pricing, apply page)
router.get("/travel/settings", async (_req, res) => {
  try {
    const s = await getSettings();
    const pub = publicSettings(s);
    // Keep FAQ / trust copy as authored in admin (do not rewrite "visa" wording)
    const { trust, ...rest } = pub;
    res.json({ ...depermitDeep(rest), trust });
  } catch (err) {
    console.error("[visa] GET /travel/settings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Score admin knowledge items against the user message (simple keyword match). */
function pickKnowledgeItems(
  items: Array<{ id: string; question: string; answer: string; tags?: string[]; sort?: number; active?: boolean }>,
  message: string,
  limit = 6,
) {
  const active = items.filter((it) => it.active !== false);
  const q = String(message || "").toLowerCase();
  const tokens = q.split(/[^a-z0-9çğıöşü]+/i).filter((t) => t.length > 2);
  const scored = active.map((item) => {
    const tags = (item.tags || []).map((t) => String(t).toLowerCase());
    const hay = `${item.question} ${item.answer} ${tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 1;
    }
    for (const tag of tags) {
      if (tag && q.includes(tag)) score += 2;
    }
    return { item, score };
  });
  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score || (a.item.sort ?? 0) - (b.item.sort ?? 0));
  const picked = matched.slice(0, limit).map((s) => s.item);
  if (picked.length >= 3) return picked;
  // Always ground with a few baseline approved answers
  const baseline = [...active].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  for (const it of baseline) {
    if (picked.length >= Math.min(limit, 5)) break;
    if (!picked.some((p) => p.id === it.id)) picked.push(it);
  }
  return picked;
}

router.post("/travel/chat", async (req, res) => {
  try {
    const { countryId, message, history, language } = req.body || {};
    const replyLang = String(language || "en").slice(0, 8);
    const country = await getCountry(countryId);
    if (!country) {
      res.status(400).json({ reply_text: "Please select your passport country first.", card: null });
      return;
    }
    const settings = await getSettings();
    const card = depermitDeep(buildCard(country));
    const optionCards = effectiveOptionCards(settings, country as unknown as AnyCountry).filter((oc) => oc.active !== false);

    // Build a grounded system prompt from country + admin knowledge + site services
    const c = country as {
      name: string; category: string; visa_summary?: string; stay_rule?: string;
      insurance_required?: boolean; headline?: string; features?: string[];
      price_label?: string; ai_extra_context?: string;
      precondition?: string; airline_conditions?: string; mission_note?: string;
    };
    const categoryLabel =
      c.category === "visa_exempt" ? "visa-exempt / visa-free eligible"
      : c.category === "evisa_direct" ? "requires a direct E-VISA"
      : c.category === "evisa_conditional" ? "may be eligible for a conditional E-VISA"
      : c.category === "age_special" ? "has age-specific entry rules"
      : "requires a sticker visa obtained from a Turkish mission";

    const factLines = [
      `Country: ${c.name}`,
      `Entry category for Türkiye: ${categoryLabel}`,
      c.visa_summary ? `Status summary: ${c.visa_summary}` : null,
      c.stay_rule ? `Stay rule: ${c.stay_rule}` : null,
      `Travel insurance required: ${c.insurance_required ? "Yes — mandatory / strongly advised" : "Not marked mandatory"}`,
      c.headline ? `Headline: ${c.headline}` : null,
      c.features?.length ? `Key features:\n${c.features.map((f) => `  - ${f}`).join("\n")}` : null,
      c.price_label ? `Pricing label: ${c.price_label}` : null,
      c.precondition ? `Precondition: ${c.precondition}` : null,
      c.airline_conditions ? `Airline conditions: ${c.airline_conditions}` : null,
      c.mission_note ? `Mission note: ${c.mission_note}` : null,
      c.ai_extra_context ? `Admin country notes:\n${c.ai_extra_context}` : null,
    ].filter(Boolean).join("\n");

    const optionLines = optionCards.length
      ? optionCards
          .map((oc, i) => {
            const bits = [
              `Option ${i + 1}: ${oc.title} — $${oc.price} ${oc.currency || "USD"}`,
              oc.description ? `  ${oc.description}` : null,
              oc.condition ? `  Condition: ${oc.condition}` : null,
              oc.bullets?.length ? `  Notes: ${oc.bullets.join(" ")}` : null,
            ].filter(Boolean);
            return bits.join("\n");
          })
          .join("\n")
      : "No option cards for this category.";

    const knowledge = settings.knowledge ?? { system_style: "", fallback_message: "", items: [] };
    const picked = pickKnowledgeItems(knowledge.items || [], String(message || ""), 6);
    const knowledgeBlock = picked.length
      ? picked.map((it, i) => `Q${i + 1}: ${it.question}\nA${i + 1}: ${it.answer}`).join("\n\n")
      : "(no approved Q&A matched)";

    const faqActive = (settings.trust?.faq || []).filter((f) => f.active !== false);
    const faqBlock = faqActive.length
      ? faqActive
          .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
          .slice(0, 8)
          .map((f, i) => `F${i + 1}: ${f.question}\nR${i + 1}: ${f.answer}`)
          .join("\n\n")
      : "";

    const serviceFacts = [
      `Insurance daily price: $${settings.pricing.insurance.daily_price} USD / day / person`,
      settings.chat.insurance_required_message
        ? `Insurance message: ${settings.chat.insurance_required_message}`
        : null,
      settings.esim.enabled
        ? `eSIM: enabled. ${settings.esim.intro || ""} Plans: ${(settings.esim.plans || [])
            .filter((p) => p.active !== false)
            .sort((a, b) => a.sort - b.sort)
            .slice(0, 8)
            .map((p) => `${p.name} ${p.data_label}/${p.validity_days}d $${p.price}`)
            .join("; ")}`
        : "eSIM: currently unavailable",
    ]
      .filter(Boolean)
      .join("\n");

    const style =
      knowledge.system_style ||
      "You are a friendly Türkiye travel entry assistant. Answer only from verified facts. Keep answers short, plain text.";

    const langNames: Record<string, string> = {
      en: "English", ar: "Arabic", tr: "Turkish", es: "Spanish", de: "German", fr: "French", ru: "Russian",
    };
    const langName = langNames[replyLang] || replyLang;
    const systemPrompt =
      `${style}\n\n` +
      `IMPORTANT: Reply entirely in ${langName} (language code: ${replyLang}).\n` +
      `Traveler passport country: ${c.name}.\n` +
      `If the question is outside Türkiye entry, insurance, eSIM, or this site's services, politely redirect.\n` +
      `If verified data does not cover the question, reply with: ${knowledge.fallback_message || "I do not have a verified answer for that."}\n\n` +
      `=== COUNTRY FACTS ===\n${factLines}\n\n` +
      `=== ENTRY OPTIONS (for this passport) ===\n${optionLines}\n\n` +
      `=== SITE SERVICES ===\n${serviceFacts}\n\n` +
      `=== APPROVED Q&A (prefer these answers; you may lightly rephrase) ===\n${knowledgeBlock}\n` +
      (faqBlock ? `\n=== SITE FAQ ===\n${faqBlock}\n` : "");

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

// ── Public order intake (applications + payment form shell) ───────────────────

const ORDER_TYPES: OrderType[] = ["entry", "sticker", "insurance", "esim"];

router.post("/travel/orders", async (req, res) => {
  try {
    const body = req.body || {};
    const type = String(body.type || "") as OrderType;
    if (!ORDER_TYPES.includes(type)) {
      res.status(400).json({ error: "Invalid order type" });
      return;
    }
    const email = String(body.email || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      res.status(400).json({ error: "Valid amount is required" });
      return;
    }
    const payment = body.payment && typeof body.payment === "object"
      ? {
          cardholder: String(body.payment.cardholder || "").slice(0, 120) || undefined,
          last4: String(body.payment.last4 || "").replace(/\D/g, "").slice(-4) || undefined,
        }
      : undefined;
    const order = await createOrder({
      type,
      amount,
      currency: String(body.currency || "USD").slice(0, 8),
      email,
      phone: body.phone ? String(body.phone).slice(0, 60) : undefined,
      customer_name: body.customer_name ? String(body.customer_name).slice(0, 160) : undefined,
      country: body.country ? String(body.country).slice(0, 120) : undefined,
      option_id: body.option_id ? String(body.option_id).slice(0, 80) : undefined,
      option_title: body.option_title ? String(body.option_title).slice(0, 200) : undefined,
      option_index: typeof body.option_index === "number" ? body.option_index : undefined,
      summary: body.summary ? String(body.summary).slice(0, 400) : undefined,
      payload: body.payload && typeof body.payload === "object" ? body.payload : {},
      payment,
      mark_paid: Boolean(body.mark_paid || payment),
    });
    res.status(201).json({ ok: true, order: { id: order.id, status: order.status, amount: order.amount } });
  } catch (err) {
    console.error("[visa] POST /travel/orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/travel/admin/orders", requireAdmin, async (_req, res) => {
  try {
    const orders = await listOrders();
    res.json({
      count: orders.length,
      orders,
      statuses: ORDER_STATUSES,
    });
  } catch (err) {
    console.error("[visa] GET admin/orders error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/travel/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
    const order = await getOrder(String(req.params.id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ order, statuses: ORDER_STATUSES });
  } catch (err) {
    console.error("[visa] GET admin/orders/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/travel/admin/orders/:id", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = req.body || {};
    let order = await getOrder(id);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (body.admin_note !== undefined && body.status === undefined) {
      order = await updateOrderNote(id, String(body.admin_note ?? ""));
    }
    if (body.status !== undefined) {
      const status = String(body.status) as OrderStatus;
      if (!ORDER_STATUSES.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      order = await updateOrderStatus(
        id,
        status,
        body.note ? String(body.note).slice(0, 400) : undefined,
        body.admin_note !== undefined ? String(body.admin_note) : undefined,
      );
    }
    res.json({ ok: true, order });
  } catch (err) {
    console.error("[visa] PATCH admin/orders/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin auth routes ─────────────────────────────────────────────────────────

const ADMIN_COOKIE = "tta_admin";

router.post("/travel/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!(await verifyAdminLogin(String(username || ""), String(password || "")))) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const token = createSessionToken();
    res.setHeader("Set-Cookie",
      `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[visa] POST /travel/admin/login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/travel/admin/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

router.get("/travel/admin/session", requireAdmin, async (_req, res) => {
  const auth = await getAdminAuth();
  res.json({ ok: true, username: auth.username });
});

router.post("/travel/admin/change-password", requireAdmin, async (req, res) => {
  try {
    const { username, new_password } = req.body || {};
    if (!new_password || String(new_password).length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const auth = await getAdminAuth();
    await setAdminCredentials(String(username || auth.username), String(new_password));
    res.json({ ok: true });
  } catch (err) {
    console.error("[visa] change-password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin settings + dashboard ───────────────────────────────────────────────

router.get("/travel/admin/settings", requireAdmin, async (_req, res) => {
  try {
    res.json({ settings: await getSettings(), defaults: DEFAULT_SETTINGS });
  } catch (err) {
    console.error("[visa] GET admin/settings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/travel/admin/settings", requireAdmin, async (req, res) => {
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    for (const key of SETTINGS_KEYS) {
      if (body[key] !== undefined) await putSetting(key, body[key]);
    }
    res.json({ ok: true, settings: await getSettings() });
  } catch (err) {
    console.error("[visa] PUT admin/settings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/travel/admin/summary", requireAdmin, async (_req, res) => {
  try {
    const all = await loadAll();
    const byCategory: Record<string, number> = {};
    for (const c of all) byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    res.json({
      total: all.length,
      active: all.filter((c) => (c as { is_active?: boolean }).is_active !== false).length,
      by_category: byCategory,
    });
  } catch (err) {
    console.error("[visa] GET admin/summary error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin country routes ──────────────────────────────────────────────────────

router.get("/travel/admin/countries", requireAdmin, async (req, res) => {
  try {
    const { category } = req.query;
    let countries = (await loadAll()).sort((a, b) => a.name.localeCompare(b.name));
    if (typeof category === "string" && (VALID_CATEGORIES as readonly string[]).includes(category)) {
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
          extra:              (existing[0].extra as Record<string, unknown> | null) ?? undefined,
        }
      : {};

    const body = req.body || {};

    // Validate option-card prices as numbers before persisting
    if (Array.isArray(body.option_cards)) {
      for (const oc of body.option_cards as Array<Record<string, unknown>>) {
        if (oc.price === undefined || oc.price === null || oc.price === "") continue;
        const n = Number(oc.price);
        if (!Number.isFinite(n) || n < 0) {
          res.status(400).json({ error: `Option card price must be a number (got "${oc.price}")` });
          return;
        }
        oc.price = n;
      }
    }
    // Validate pricing overrides (finite, non-negative numbers only)
    {
      const perr = validatePricingOverride(body.pricing_override);
      if (perr) { res.status(400).json({ error: perr }); return; }
    }
    // Never allow a year to be saved into the requirements title
    if (typeof body.requirements_title === "string") body.requirements_title = stripYear(body.requirements_title);

    // Collect extended fields into the extra JSON blob
    const prevExtra = prev.extra || {};
    const nextExtra: Record<string, unknown> = { ...prevExtra };
    for (const f of EXTRA_FIELDS) {
      if (body[f] !== undefined) nextExtra[f] = body[f];
    }

    const updated: Override = {
      visa_summary:       body.visa_summary      ?? prev.visa_summary,
      stay_rule:          body.stay_rule          ?? prev.stay_rule,
      insurance_required: body.insurance_required ?? prev.insurance_required,
      admin_html_notes:   body.admin_html_notes   ?? prev.admin_html_notes ?? "",
      ai_extra_context:   body.ai_extra_context   ?? prev.ai_extra_context ?? "",
      is_active:          body.is_active          ?? prev.is_active,
      extra:              Object.keys(nextExtra).length > 0 ? nextExtra : undefined,
    };

    await upsertDbOverride(country.id, updated);

    const updatedCountry = await getCountry(country.id);
    const settings = await getSettings();
    res.json({
      ok: true,
      country: updatedCountry,
      card: buildCard(updatedCountry),
      option_cards: effectiveOptionCards(settings, updatedCountry as unknown as AnyCountry),
      pricing: effectivePricing(settings, updatedCountry as unknown as AnyCountry),
    });
  } catch (err) {
    console.error("[visa] PUT /visa/admin/countries/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a brand-new country (stored entirely as a DB override)
router.post("/travel/admin/countries", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) { res.status(400).json({ error: "name is required" }); return; }
    const id = String(body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    if (await getCountry(id)) { res.status(409).json({ error: "Country already exists" }); return; }

    {
      const perr = validatePricingOverride(body.pricing_override);
      if (perr) { res.status(400).json({ error: perr }); return; }
    }
    if (Array.isArray(body.option_cards)) {
      for (const oc of body.option_cards as Array<Record<string, unknown>>) {
        if (oc.price === undefined || oc.price === null || oc.price === "") continue;
        const n = Number(oc.price);
        if (!Number.isFinite(n) || n < 0) {
          res.status(400).json({ error: `Option card price must be a number (got "${oc.price}")` });
          return;
        }
        oc.price = n;
      }
    }
    if (typeof body.requirements_title === "string") body.requirements_title = stripYear(body.requirements_title);

    const extra: Record<string, unknown> = { name };
    for (const f of EXTRA_FIELDS) if (body[f] !== undefined) extra[f] = body[f];
    if (!extra.category) extra.category = "evisa_direct";

    await upsertDbOverride(id, {
      visa_summary: body.visa_summary, stay_rule: body.stay_rule,
      insurance_required: body.insurance_required, admin_html_notes: body.admin_html_notes,
      ai_extra_context: body.ai_extra_context, is_active: body.is_active ?? true,
      extra,
    });
    res.json({ ok: true, country: await getCountry(id) });
  } catch (err) {
    console.error("[visa] POST admin/countries error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a country override (restores seed defaults, or removes admin-created country)
router.delete("/travel/admin/countries/:id/override", requireAdmin, async (req, res) => {
  try {
    await db.delete(visaCountryOverridesTable)
      .where(eq(visaCountryOverridesTable.countryId, String(req.params.id)));
    res.json({ ok: true, country: (await getCountry(String(req.params.id))) ?? null });
  } catch (err) {
    console.error("[visa] DELETE admin override error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
