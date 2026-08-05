import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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
function writeJson(file: string, data: unknown): void {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
function sanitize(html: string): string {
  return String(html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

function loadAll() {
  const exemptFile  = readJson<ExemptFile>(EXEMPT_PATH, { defaults: {}, countries: [] });
  const evisaFile   = readJson<EvisaFile>(EVISA_PATH,  { countries: [] });
  const overrides   = readJson<Record<string, Override>>(OVERRIDES_PATH, {});
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
      cta: (c as RawCountry).cta ?? (exemptDefs as RawCountry).cta ?? "Get travel insurance",
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

function getCountry(idOrIso: string) {
  const key = String(idOrIso || "").toLowerCase();
  return loadAll().find(
    (c) =>
      c.id === key ||
      c.iso2.toLowerCase() === key ||
      c.name.toLowerCase() === key ||
      ((c as RawCountry).slug || "").toLowerCase() === key,
  );
}

function buildCard(country: ReturnType<typeof getCountry>) {
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

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers["x-admin-password"] as string) || (req.query.password as string);
  if (token !== ADMIN_PASSWORD) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

// ── Public routes ─────────────────────────────────────────────────────────────

router.get("/visa/countries", (_req, res) => {
  const countries = loadAll()
    .filter((c) => (c as { is_active?: boolean }).is_active !== false)
    .map((c) => ({
      id: c.id, name: c.name, name_tr: (c as { name_tr?: string }).name_tr,
      iso2: c.iso2, flag_emoji: c.flag_emoji,
      category: c.category,
      visa_summary: (c as { visa_summary?: string }).visa_summary,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  res.json({ count: countries.length, countries });
});

router.get("/visa/countries/:id", (req, res) => {
  const country = getCountry(req.params.id);
  if (!country) { res.status(404).json({ error: "Country not found" }); return; }
  res.json({ country, card: buildCard(country) });
});

router.post("/visa/chat", (req, res) => {
  const { countryId, message } = req.body || {};
  const country = getCountry(countryId);
  if (!country) {
    res.status(400).json({ reply_text: "Please select your passport country first.", card: null });
    return;
  }
  const card = buildCard(country);
  const lower = String(message || "").toLowerCase();
  const isEvisa = country.category === "evisa_direct";

  let reply_text = isEvisa
    ? `${country.name} passport holders can obtain a direct e-Visa for Türkiye. Travel insurance is also required for your stay.`
    : `${country.name} is visa-exempt for Türkiye. Travel health insurance is mandatory for your stay.`;

  if (lower.includes("insurance") || lower.includes("sigorta")) {
    reply_text = `Yes — travel insurance is required for ${country.name} passport holders entering Türkiye, regardless of visa status.`;
  } else if (lower.includes("how long") || lower.includes("days") || lower.includes("stay")) {
    reply_text = `${country.name}: ${card?.visa_status}. ${card?.body[0]}`;
  } else if (lower.includes("evisa") || lower.includes("e-visa") || lower.includes("apply")) {
    reply_text = isEvisa
      ? `You'll need to apply for an e-Visa before travel. Click APPLY NOW to start your application through our secure portal.`
      : `${country.name} passport holders do not need a visa for Türkiye — you are visa-exempt.`;
  } else {
    const extra = (country as { ai_extra_context?: string }).ai_extra_context;
    if (extra) reply_text += `\n\n${extra}`;
  }

  res.json({ reply_text, card });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

router.get("/visa/admin/countries", requireAdmin, (req, res) => {
  const { category } = req.query;
  let countries = loadAll().sort((a, b) => a.name.localeCompare(b.name));
  if (category === "visa_exempt" || category === "evisa_direct") {
    countries = countries.filter((c) => c.category === category);
  }
  res.json({ countries });
});

router.get("/visa/admin/countries/:id", requireAdmin, (req, res) => {
  const country = getCountry(req.params.id);
  if (!country) { res.status(404).json({ error: "Country not found" }); return; }
  res.json({ country, card: buildCard(country) });
});

router.put("/visa/admin/countries/:id", requireAdmin, (req, res) => {
  const country = getCountry(req.params.id);
  if (!country) { res.status(404).json({ error: "Country not found" }); return; }
  const overrides = readJson<Record<string, Override>>(OVERRIDES_PATH, {});
  const prev = overrides[country.id] || {};
  const body = req.body || {};
  overrides[country.id] = {
    ...prev,
    visa_summary:      body.visa_summary      ?? prev.visa_summary,
    stay_rule:         body.stay_rule          ?? prev.stay_rule,
    insurance_required: body.insurance_required ?? prev.insurance_required,
    admin_html_notes:  body.admin_html_notes   ?? prev.admin_html_notes ?? "",
    ai_extra_context:  body.ai_extra_context   ?? prev.ai_extra_context ?? "",
  };
  writeJson(OVERRIDES_PATH, overrides);
  const updated = getCountry(country.id);
  res.json({ ok: true, country: updated, card: buildCard(updated) });
});

export default router;
