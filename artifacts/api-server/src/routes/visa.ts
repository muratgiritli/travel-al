import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const router: IRouter = Router();

// Resolve data directory relative to this compiled file (dist/routes/visa.js → dist/ → data/visa/)
const __dirname_compat = dirname(fileURLToPath(import.meta.url));
// dist/index.mjs → dist/ → artifacts/api-server/ → data/visa/
const DATA_DIR = join(__dirname_compat, "..", "data", "visa");
const SEED_PATH = join(DATA_DIR, "visa-exempt-countries.json");
const OVERRIDES_PATH = join(DATA_DIR, "country-overrides.json");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// ── Helpers ─────────────────────────────────────────────────────────────────

function readJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function writeJson(file: string, data: unknown): void {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

interface SeedCountry {
  id: string; name: string; name_tr?: string; iso2: string; flag_emoji: string;
  visa_summary?: string; stay_rule?: string; insurance_required?: boolean;
  admin_html_notes?: string; ai_extra_context?: string; is_active?: boolean;
}

interface SeedFile {
  defaults: Record<string, unknown>;
  countries: SeedCountry[];
}

interface CountryOverride {
  visa_summary?: string; stay_rule?: string; insurance_required?: boolean;
  admin_html_notes?: string; ai_extra_context?: string; is_active?: boolean;
}

function loadCountries() {
  const seed = readJson<SeedFile>(SEED_PATH, { defaults: {}, countries: [] });
  const overrides = readJson<Record<string, CountryOverride>>(OVERRIDES_PATH, {});
  const defaults = seed.defaults || {};
  return (seed.countries || []).map((c) => {
    const o: CountryOverride = overrides[c.id] || {};
    return {
      ...defaults, ...c, ...o,
      category: "visa_exempt",
      insurance_required: o.insurance_required ?? c.insurance_required ?? true,
      admin_html_notes: o.admin_html_notes ?? c.admin_html_notes ?? "",
      ai_extra_context: o.ai_extra_context ?? c.ai_extra_context ?? "",
      is_active: o.is_active ?? c.is_active ?? true,
    };
  });
}

function getCountry(idOrIso: string) {
  const key = String(idOrIso || "").toLowerCase();
  return loadCountries().find(
    (c) => c.id === key || c.iso2.toLowerCase() === key || c.name.toLowerCase() === key,
  );
}

function sanitize(html: string): string {
  return String(html || "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

function buildCard(country: ReturnType<typeof getCountry>) {
  if (!country) return null;
  const seed = readJson<SeedFile>(SEED_PATH, { defaults: {}, countries: [] });
  const defaults = seed.defaults as Record<string, unknown>;
  return {
    country: country.name,
    name_tr: country.name_tr,
    iso2: country.iso2,
    flag_emoji: country.flag_emoji,
    visa_status: country.visa_summary || (defaults.visa_summary as string),
    insurance_required: !!country.insurance_required,
    headline: (country as { headline?: string }).headline || (defaults.headline as string),
    body: [
      country.stay_rule || (defaults.stay_rule as string),
      "However, travel insurance covering the full length of your stay is mandatory.",
    ],
    features: (country as { features?: string[] }).features || (defaults.features as string[]),
    price_label: (country as { price_label?: string }).price_label || (defaults.price_label as string),
    price_example: (country as { price_example?: string }).price_example || (defaults.price_example as string),
    cta: (country as { cta?: string }).cta || (defaults.cta as string),
    admin_html_notes: sanitize(country.admin_html_notes || ""),
    ai_extra_context: country.ai_extra_context || "",
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers["x-admin-password"] as string) || (req.query.password as string);
  if (token !== ADMIN_PASSWORD) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

// ── Public routes ────────────────────────────────────────────────────────────

router.get("/visa/countries", (_req, res) => {
  const countries = loadCountries()
    .filter((c) => c.is_active)
    .map((c) => ({
      id: c.id, name: c.name, name_tr: c.name_tr,
      iso2: c.iso2, flag_emoji: c.flag_emoji, visa_summary: c.visa_summary,
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
  let reply_text = `${country.name} is visa-exempt for Türkiye. But travel health insurance is mandatory for your stay.`;
  if (lower.includes("insurance") || lower.includes("sigorta")) {
    reply_text = `Yes — travel insurance is required for ${country.name} passport holders entering Türkiye, even though you are visa-exempt.`;
  } else if (lower.includes("how long") || lower.includes("days")) {
    reply_text = `${country.name}: ${card?.visa_status}. ${card?.body[0]}`;
  } else if (country.ai_extra_context) {
    reply_text = `${reply_text}\n\nNote: ${country.ai_extra_context}`;
  }
  res.json({ reply_text, card });
});

// ── Admin routes ─────────────────────────────────────────────────────────────

router.get("/visa/admin/countries", requireAdmin, (_req, res) => {
  res.json({ countries: loadCountries().sort((a, b) => a.name.localeCompare(b.name)) });
});

router.get("/visa/admin/countries/:id", requireAdmin, (req, res) => {
  const country = getCountry(req.params.id);
  if (!country) { res.status(404).json({ error: "Country not found" }); return; }
  res.json({ country, card: buildCard(country) });
});

router.put("/visa/admin/countries/:id", requireAdmin, (req, res) => {
  const country = getCountry(req.params.id);
  if (!country) { res.status(404).json({ error: "Country not found" }); return; }
  const overrides = readJson<Record<string, CountryOverride>>(OVERRIDES_PATH, {});
  const prev = overrides[country.id] || {};
  const body = req.body || {};
  overrides[country.id] = {
    ...prev,
    visa_summary: body.visa_summary ?? prev.visa_summary ?? country.visa_summary,
    stay_rule: body.stay_rule ?? prev.stay_rule ?? country.stay_rule,
    insurance_required: body.insurance_required ?? prev.insurance_required ?? country.insurance_required,
    admin_html_notes: body.admin_html_notes ?? prev.admin_html_notes ?? "",
    ai_extra_context: body.ai_extra_context ?? prev.ai_extra_context ?? "",
    is_active: body.is_active ?? prev.is_active ?? true,
  };
  writeJson(OVERRIDES_PATH, overrides);
  const updated = getCountry(country.id);
  res.json({ ok: true, country: updated, card: buildCard(updated) });
});

export default router;
