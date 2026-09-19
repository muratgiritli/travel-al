import { createHmac, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { CONTENT_SEED, SCHENGEN_RESIDENCE_TAGS } from "./contentSeed";
import { KNOWLEDGE_SEED } from "./knowledgeSeed";

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
  require_age_confirm?: boolean;
  age_confirm_info?: string;
  age_confirm_question?: string;
}

/** Turkey eSIM plan — sample defaults inspired by esimsale.com Turkey packages. */
export interface EsimPlanDef {
  id: string;
  name: string;
  data_label: string;
  validity_days: number;
  price: number;
  currency?: string;
  network: string;
  hotspot: boolean;
  coverage: string;
  features: string[];
  details: string;
  sort: number;
  active: boolean;
}

const DEFAULT_ESIM_PLANS: EsimPlanDef[] = [
  {
    id: 'tr-1gb-7d',
    name: 'Turkey 1 GB',
    data_label: '1 GB',
    validity_days: 7,
    price: 4.5,
    network: 'Turkcell',
    hotspot: true,
    coverage: 'Türkiye',
    features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'],
    details:
      'Kısa ziyaretler için ideal başlangıç paketi. Ödeme sonrası eSIM QR kodu e-posta ile iletilir; telefonunuzda birkaç dakikada aktif edilir.',
    sort: 1,
    active: true,
  },
  {
    id: 'tr-2gb-15d',
    name: 'Turkey 2 GB',
    data_label: '2 GB',
    validity_days: 15,
    price: 6.5,
    network: 'Turkcell',
    hotspot: true,
    coverage: 'Türkiye',
    features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'],
    details:
      '1–2 haftalık seyahatler için dengeli paket. Harita, mesajlaşma ve günlük kullanım için uygundur.',
    sort: 2,
    active: true,
  },
  {
    id: 'tr-3gb-30d',
    name: 'Turkey 3 GB',
    data_label: '3 GB',
    validity_days: 30,
    price: 8.5,
    network: 'Turkcell',
    hotspot: true,
    coverage: 'Türkiye',
    features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'],
    details:
      'Aylık geçerlilikli ekonomik paket. Orta düzey veri ihtiyacı olan gezginler için uygundur.',
    sort: 3,
    active: true,
  },
  {
    id: 'tr-5gb-30d',
    name: 'Turkey 5 GB',
    data_label: '5 GB',
    validity_days: 30,
    price: 12,
    network: 'Turkcell',
    hotspot: true,
    coverage: 'Türkiye',
    features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'],
    details:
      'Şehir + sahil turları için popüler seçenek. Sosyal medya ve navigasyon kullanımına rahat eder.',
    sort: 4,
    active: true,
  },
  {
    id: 'tr-10gb-30d',
    name: 'Turkey 10 GB',
    data_label: '10 GB',
    validity_days: 30,
    price: 18,
    network: 'Turkcell',
    hotspot: true,
    coverage: 'Türkiye',
    features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'],
    details:
      'Yoğun kullanım ve hotspot ihtiyacı için önerilir. Uzun tatillerde güvenli veri kotası sağlar.',
    sort: 5,
    active: true,
  },
  {
    id: 'tr-20gb-30d',
    name: 'Turkey 20 GB',
    data_label: '20 GB',
    validity_days: 30,
    price: 26,
    network: 'Turkcell',
    hotspot: true,
    coverage: 'Türkiye',
    features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'],
    details:
      'Yüksek veri ihtiyacı veya birden fazla cihaz paylaşımı için premium paket.',
    sort: 6,
    active: true,
  },
];

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
    welcome_message: "Check your entry requirements, choose the travel services that suit your needs, and complete your application with instant AI\u00A0assistance.",
    passport_selected_message: "Passport selected.",
    insurance_required_message: "Travel health insurance is mandatory for the full duration of your stay.",
    bottom_disclaimer: "",
    faq_text: "Frequently asked questions about travelling to Türkiye.",
    track_text: "Track your application status here.",
    contact_text: "Contact our travel experts — we reply within 24 hours.",
  },
  content: CONTENT_SEED,
  apply: {
    title: "Start your application",
    intro: "Fill in your details and our team will process your e-Permit.",
    form_fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "passport_number", label: "Passport number", type: "text", required: true },
      { name: "arrival_date", label: "Planned arrival date", type: "date", required: false },
    ],
    success_message: "Application received! Check your email for the next steps.",
    success_title: "Application received",
    success_email_note: "A confirmation was sent to {email}. Keep your tracking number for status updates.",
    tracking_prefix: "TEG",
    force_insurance: true,
  },
  brand: {
    site_name: "Turkey Travel Assistant",
    logo_emoji: "🕌",
    logo_url: "",
    favicon_url: "",
    footer_text: "Turkey Travel Assistant — independent travel consultancy.",
    /** Welcome screen background (URL or data:image…). Empty = default Istanbul image. */
    welcome_bg_url: "/istanbul-welcome-bg.jpg",
  },
  trust: {
    trust_title: "Why travelers choose us",
    trust_lines: [],
    faq_title: "FAQ",
    faq: [
      {
        id: "f1",
        question: "What does Schengen mean?",
        answer:
          "Schengen is a group of European countries with shared border rules. A valid Schengen residence permit or entry stamp can help some travelers qualify for a Türkiye e-Permit option.",
        sort: 1,
        active: true,
      },
      {
        id: "f2",
        question: "How long does delivery take?",
        answer:
          "Depending on the processing speed you choose, delivery typically occurs between 60 minutes and 7 days. Details are sent to your email.",
        sort: 2,
        active: true,
      },
      {
        id: "f3",
        question: "Do I need travel insurance?",
        answer:
          "Travel health insurance covering your full stay in Türkiye is required or strongly advised for most travelers, including many entry-free nationalities.",
        sort: 3,
        active: true,
      },
    ],
  },
  option_card_defaults: {
    evisa_conditional: [
      { id: "resident", title: "Get a Turkey e-Permit", description: "If you have a valid residence permit in any of the following countries:", condition: "", eligible_tags: [...SCHENGEN_RESIDENCE_TAGS], price: 60, sort: 1, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days."] },
      { id: "valid-permit", title: "Get a Turkey e-Permit", description: "If you have a valid entry permit to any of the following countries:", condition: "", eligible_tags: ["EU Schengen Area", "US United States", "GB United Kingdom", "IE Ireland"], price: 60, sort: 2, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["If you hold a valid physical entry permit from the Schengen Area, USA, UK, or Ireland, you are eligible for an easy online e-Permit. Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days."] },
      { id: "gcc", title: "Get a Turkey Entry Permit", description: "If you have a valid residence permit to any of the following countries:", condition: "", eligible_tags: ["AE UAE", "SA Saudi Arabia", "QA Qatar", "KW Kuwait", "OM Oman", "BH Bahrain"], price: 60, sort: 3, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["Citizens holding a valid residence permit from one of the following countries are eligible to apply for a Turkey entry permit for holiday purposes. This streamlines the process, offering a 30-day stay in Turkey. Your application and information details will be sent to your email address within the same day."] },
      { id: "sticker", title: "Get a Turkey Entry Permit", description: "If you do not qualify for an online e-Permit option:", condition: "", eligible_tags: ["Document preparation", "Embassy appointment", "Form & biometric support", "Application tracking"], price: 20, sort: 4, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["If you do not qualify for an online e-Permit, our consultancy supports a Turkey entry permit through the embassy / consulate sticker process. We guide you on documents, appointments, forms and biometrics. Application details and next steps are sent to your email."] },
    ] as OptionCardDef[],
    age_special: [
      { id: "age-direct", title: "Get a Turkey e-Permit", description: "Direct e-Permit for eligible age groups.", price: 60, sort: 1, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["e-Permit + travel info delivered by email.", "Delivery between 60 minutes and 7 days."], require_age_confirm: true, age_confirm_info: "Under 15 and over 45 can apply for a direct e-Permit without additional permit conditions.", age_confirm_question: "Are you under 15 or over 45?" },
      { id: "age-permit", title: "Get a Turkey e-Permit", description: "With a valid entry permit for an eligible country.", condition: "Valid physical entry permit from the Schengen Area, USA, UK or Ireland required.", eligible_tags: ["EU Schengen Area", "US United States", "GB United Kingdom", "IE Ireland"], price: 60, sort: 2, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["If you hold a valid physical entry permit from the Schengen Area, USA, UK, or Ireland, you are eligible for an easy online e-Permit. Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days."] },
      { id: "gcc", title: "Get a Turkey Entry Permit", description: "If you have a valid residence permit to any of the following countries:", condition: "", eligible_tags: ["AE UAE", "SA Saudi Arabia", "QA Qatar", "KW Kuwait", "OM Oman", "BH Bahrain"], price: 60, sort: 3, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["Citizens holding a valid residence permit from one of the following countries are eligible to apply for a Turkey entry permit for holiday purposes. This streamlines the process, offering a 30-day stay in Turkey. Your application and information details will be sent to your email address within the same day."] },
      { id: "sticker", title: "Get a Turkey Entry Permit", description: "If you do not qualify for an online e-Permit option:", condition: "", eligible_tags: ["Document preparation", "Embassy appointment", "Form & biometric support", "Application tracking"], price: 20, sort: 4, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["If you do not qualify for an online e-Permit, our consultancy supports a Turkey entry permit through the embassy / consulate sticker process. We guide you on documents, appointments, forms and biometrics. Application details and next steps are sent to your email."] },
    ] as OptionCardDef[],
    sticker_mission: [
      { id: "consultancy", title: "Get a Turkey Entry Permit", description: "If you do not qualify for an online e-Permit option:", condition: "", eligible_tags: ["Document preparation", "Embassy appointment", "Form & biometric support", "Application tracking"], price: 20, sort: 1, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["If you do not qualify for an online e-Permit, our consultancy supports a Turkey entry permit through the embassy / consulate sticker process. We guide you on documents, appointments, forms and biometrics. Application details and next steps are sent to your email."] },
      { id: "gcc", title: "Get a Turkey Entry Permit", description: "If you have a valid residence permit to any of the following countries:", condition: "", eligible_tags: ["AE UAE", "SA Saudi Arabia", "QA Qatar", "KW Kuwait", "OM Oman", "BH Bahrain"], price: 60, sort: 2, active: true, cta_label: "APPLY NOW", cta_href: "/next", bullets: ["Citizens holding a valid residence permit from one of the following countries are eligible to apply for a Turkey entry permit for holiday purposes. This streamlines the process, offering a 30-day stay in Turkey. Your application and information details will be sent to your email address within the same day."] },
    ] as OptionCardDef[],
    evisa_direct: [
      {
        id: "direct",
        title: "Get a Turkey e-Permit",
        description: "Online e-Permit for your passport — apply here in the assistant.",
        price: 60,
        sort: 1,
        active: true,
        cta_label: "APPLY NOW",
        cta_href: "/next",
        bullets: [
          "Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days.",
        ],
      },
    ] as OptionCardDef[],
    visa_exempt: [] as OptionCardDef[],
  },
  esim: {
    enabled: true,
    currency: 'USD',
    intro: 'Türkiye için eSIM veri paketleri. Ödeme sonrası dakikalar içinde QR ile kurulum.',
    cta_label: 'BUY eSIM',
    cta_href: '/next',
    plans: DEFAULT_ESIM_PLANS,
  },
  /** Server-only AI grounding bank — not exposed on public /settings. */
  knowledge: KNOWLEDGE_SEED,
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
const DEFAULT_USERNAME = "admin";

// Development keeps working without configuration; production must not fall
// back to a value that is published in this repository.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function requiredSecret(name: "SESSION_SECRET" | "ADMIN_PASSWORD", devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (IS_PRODUCTION) {
    throw new Error(`${name} must be set in production. Refusing to start with a default.`);
  }
  return devFallback;
}

const SESSION_SECRET = requiredSecret("SESSION_SECRET", "dev-secret");
const DEFAULT_PASSWORD = requiredSecret("ADMIN_PASSWORD", "admin123");

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
