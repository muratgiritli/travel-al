import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";

/* ────────────────────────────────────────────────────────────────────────────
 * Site settings store: key → JSON value persisted in Postgres,
 * deep-merged over hard defaults so new fields always have values.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface OptionCardDef {
  id: string;
  title: string;
  description: string;
  condition?: string;
  eligible_tags?: string[];
  price: number;
  currency?: string;
  sort: number;
  active: boolean;
  cta_label: string;
  cta_href: string; // internal only, e.g. /next or /apply/{slug}
  bullets?: string[];
}

export const DEFAULT_SETTINGS = {
  pricing: {
    insurance: {
      daily_price: 5,
      min_days: 1,
      per_traveler: true,
      required_default: true,
      example_text: "Example: 10 days × $5/day = $50 per traveler.",
    },
    fees: {
      standard_service: 60,
      express: 25,
      sticker_consultancy: 20,
      conditional_option: 60,
      gulf_support: 20,
      currency: "USD",
      tax_enabled: false,
      tax_percent: 0,
    },
  },
  chat: {
    welcome_message: "Which country issued your passport?",
    passport_selected_message: "Passport selected.",
    insurance_required_message: "Travel health insurance is mandatory for the full duration of your stay.",
    bottom_disclaimer: "AI guidance • Human travel experts available.",
    faq_text: "Frequently asked questions about travelling to Türkiye.",
    track_text: "Track your application status here.",
    contact_text: "Contact our travel experts — we reply within 24 hours.",
  },
  apply: {
    title: "Start your application",
    intro: "Fill in your details and our team will process your travel authorization.",
    form_fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "passport_number", label: "Passport number", type: "text", required: true },
      { name: "arrival_date", label: "Planned arrival date", type: "date", required: false },
    ],
    success_message: "Application received! Check your email for the next steps.",
    force_insurance: true,
  },
  brand: {
    site_name: "Turkey Travel Assistant",
    logo_emoji: "🕌",
    logo_url: "",
    favicon_url: "",
    footer_text: "Turkey Travel Assistant — independent travel consultancy.",
  },
  option_card_defaults: {
    evisa_conditional: [
      { id: "resident", title: "Get a Turkey e-Permit", description: "If you have a valid residence permit in an eligible country.", condition: "Hold a valid residence permit from a Schengen/EU country, UK, USA, Canada, Australia, Japan, or South Korea to qualify.", eligible_tags: ["Schengen", "UK", "USA", "Canada", "Australia", "Japan", "South Korea"], price: 60, sort: 1, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["e-Permit + travel info delivered by email.", "Delivery between 60 minutes and 7 days."] },
      { id: "valid-permit", title: "Get a Turkey e-Permit", description: "If you hold a valid entry permit for an eligible country.", condition: "Valid physical entry permit from the Schengen Area, USA, UK or Ireland required.", eligible_tags: ["Schengen", "USA", "UK", "Ireland"], price: 60, sort: 2, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["e-Permit + travel info delivered by email.", "Delivery between 60 minutes and 7 days."] },
      { id: "gcc", title: "Holiday Entry — GCC Residence", description: "Residents of GCC countries may be eligible for a 30-day holiday entry stream to Türkiye.", price: 20, sort: 3, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: [] },
      { id: "sticker", title: "Sticker Permit Consultancy", description: "Embassy sticker permit consultancy service.", price: 20, sort: 4, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["Document preparation guidance", "Embassy appointment coordination", "Form & biometric support", "Application status tracking"] },
    ] as OptionCardDef[],
    age_special: [
      { id: "age-direct", title: "Get a Turkey e-Permit", description: "Direct e-Permit for eligible age groups.", price: 60, sort: 1, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["e-Permit + travel info delivered by email.", "Delivery between 60 minutes and 7 days."] },
      { id: "age-permit", title: "Get a Turkey e-Permit", description: "With a valid entry permit for an eligible country.", condition: "Valid physical entry permit from the Schengen Area, USA, UK or Ireland required.", price: 60, sort: 2, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: [] },
      { id: "gcc", title: "Holiday Entry — GCC Residence", description: "Residents of GCC countries may be eligible for a 30-day holiday entry stream to Türkiye.", price: 20, sort: 3, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: [] },
      { id: "sticker", title: "Sticker Permit Consultancy", description: "Embassy sticker permit consultancy service.", price: 20, sort: 4, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["Document preparation guidance", "Embassy appointment coordination", "Form & biometric support", "Application status tracking"] },
    ] as OptionCardDef[],
    sticker_mission: [
      { id: "consultancy", title: "Sticker Permit Consultancy Service", description: "Full-service embassy sticker permit support.", price: 20, sort: 1, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["Full document preparation & checklist", "Consular appointment booking assistance", "Form completion & biometric support", "24/7 application status tracking"] },
      { id: "gcc", title: "Holiday Entry — GCC Residence", description: "Residents of GCC countries may be eligible for a 30-day holiday entry stream to Türkiye.", price: 20, sort: 2, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: [] },
    ] as OptionCardDef[],
    evisa_direct: [] as OptionCardDef[],
    visa_exempt: [] as OptionCardDef[],
  },
};

export type SiteSettings = typeof DEFAULT_SETTINGS;
export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Deep merge stored values over defaults (arrays replace wholesale). */
function deepMerge<T>(base: T, over: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(over)) {
    return (over === undefined ? base : (over as T));
  }
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = deepMerge((base as Record<string, unknown>)[k], v);
  }
  return out as T;
}

export async function getSettings(): Promise<SiteSettings> {
  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await db.select().from(siteSettingsTable);
  } catch (err) {
    console.error("[settings] DB read failed, using defaults:", err);
  }
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<string, unknown>;
  for (const key of SETTINGS_KEYS) out[key] = deepMerge(DEFAULT_SETTINGS[key], stored[key]);
  return out as SiteSettings;
}

export async function putSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(siteSettingsTable)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value, updatedAt: new Date() } });
}

/* ────────────────────────────────────────────────────────────────────────────
 * Admin credentials + session tokens
 * ──────────────────────────────────────────────────────────────────────────── */

const AUTH_KEY = "admin_auth";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const s = salt || randomBytes(16).toString("hex");
  const h = scryptSync(password, s, 32).toString("hex");
  return { salt: s, hash: h };
}

interface AdminAuth { username: string; salt: string; hash: string }

export async function getAdminAuth(): Promise<AdminAuth> {
  try {
    const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, AUTH_KEY));
    if (rows.length > 0) return rows[0].value as AdminAuth;
  } catch (err) {
    console.error("[settings] auth read failed:", err);
  }
  const { salt, hash } = hashPassword(DEFAULT_PASSWORD);
  return { username: DEFAULT_USERNAME, salt, hash };
}

export async function setAdminCredentials(username: string, password: string): Promise<void> {
  const { salt, hash } = hashPassword(password);
  await putSetting(AUTH_KEY, { username, salt, hash });
}

export async function verifyAdminLogin(username: string, password: string): Promise<boolean> {
  const auth = await getAdminAuth();
  if (username !== auth.username) return false;
  const { hash } = hashPassword(password, auth.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(auth.hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Legacy header support: verify a raw password against stored credentials. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const auth = await getAdminAuth();
  const { hash } = hashPassword(password, auth.salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(auth.hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* Stateless signed session token: `${expiryMs}.${hmac}` */
export function createSessionToken(ttlMs = 7 * 24 * 3600 * 1000): string {
  const exp = Date.now() + ttlMs;
  const sig = createHmac("sha256", SESSION_SECRET).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now()) return false;
  const expected = createHmac("sha256", SESSION_SECRET).update(expStr).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}
