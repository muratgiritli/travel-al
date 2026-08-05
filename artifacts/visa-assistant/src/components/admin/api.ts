// ── Admin API client + shared types ──────────────────────────────────────────
// All admin fetches use the same convention as the rest of the app:
// direct calls to '/api/travel/...'. The auth session is an HttpOnly cookie
// set by the server on login, so no extra headers are needed here.

const BASE = '/api/travel';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────
export function adminLogin(username: string, password: string) {
  return request<{ ok: boolean }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
export function adminLogout() {
  return request<{ ok: boolean }>('/admin/logout', { method: 'POST' });
}
export function adminSession() {
  return request<{ ok: boolean; username: string }>('/admin/session');
}
export function changePassword(payload: { username?: string; new_password: string }) {
  return request<{ ok: boolean }>('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Dashboard ───────────────────────────────────────────────────────────────
export interface Summary {
  total: number;
  active: number;
  by_category: Record<string, number>;
}
export function getSummary() {
  return request<Summary>('/admin/summary');
}

// ── Countries ─────────────────────────────────────────────────────────────
export function getCountries(category?: string) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return request<{ countries: RawCountry[] }>(`/admin/countries${q}`);
}
export function getCountry(id: string) {
  return request<{ country: RawCountry; card: CardPreview }>(
    `/admin/countries/${encodeURIComponent(id)}`,
  );
}
export function saveCountry(id: string, payload: Partial<CountryPayload>) {
  return request<CountrySaveResponse>(`/admin/countries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
export function createCountry(payload: Partial<CountryPayload> & { name: string }) {
  return request<{ ok: boolean; country: RawCountry }>('/admin/countries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export function resetCountry(id: string) {
  return request<{ ok: boolean; country: RawCountry | null }>(
    `/admin/countries/${encodeURIComponent(id)}/override`,
    { method: 'DELETE' },
  );
}

// ── Settings ────────────────────────────────────────────────────────────────
export function getSettings() {
  return request<{ settings: SiteSettings; defaults: SiteSettings }>('/admin/settings');
}
export function putSettings(payload: Partial<SiteSettings>) {
  return request<{ ok: boolean; settings: SiteSettings }>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ── Types ───────────────────────────────────────────────────────────────────
export type Category =
  | 'visa_exempt'
  | 'evisa_direct'
  | 'evisa_conditional'
  | 'age_special'
  | 'sticker_mission';

export interface AgeBand {
  label: string;
  status: string;
  detail: string;
}

export interface OptionCard {
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
  cta_href: string;
  bullets?: string[];
}

export interface PricingOverride {
  insurance?: Partial<Insurance>;
  fees?: Partial<Fees>;
}

export interface RawCountry {
  id: string;
  name: string;
  name_tr?: string;
  iso2: string;
  flag_emoji: string;
  slug?: string;
  category: Category;
  visa_summary?: string;
  stay_rule?: string;
  insurance_required?: boolean;
  admin_html_notes?: string;
  ai_extra_context?: string;
  is_active?: boolean;
  precondition?: string;
  age_bands?: AgeBand[];
  airline_conditions?: string;
  mission_note?: string;
  headline?: string;
  features?: string[];
  price_label?: string;
  price_example?: string;
  cta?: string;
  cta_href?: string;
  option_cards?: OptionCard[];
  pricing_override?: PricingOverride;
}

export interface CountryPayload extends RawCountry {}

export interface CardPreview {
  country: string;
  iso2: string;
  flag_emoji: string;
  category: Category;
  visa_status: string;
  insurance_required: boolean;
  headline: string;
  body: string[];
  features: string[];
  price_label: string;
  price_example: string;
  cta: string;
  cta_href: string;
  admin_html_notes: string;
}

export interface EffectivePricing {
  insurance: Insurance;
  fees: Fees;
}

export interface CountrySaveResponse {
  ok: boolean;
  country: RawCountry;
  card: CardPreview;
  option_cards: OptionCard[];
  pricing: EffectivePricing;
}

export interface Insurance {
  daily_price: number;
  min_days: number;
  per_traveler: boolean;
  required_default: boolean;
  example_text: string;
}
export interface Fees {
  standard_service: number;
  express: number;
  sticker_consultancy: number;
  conditional_option: number;
  gulf_support: number;
  currency: string;
  tax_enabled: boolean;
  tax_percent: number;
}
export interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}
export interface SiteSettings {
  pricing: { insurance: Insurance; fees: Fees };
  chat: {
    welcome_message: string;
    passport_selected_message: string;
    insurance_required_message: string;
    bottom_disclaimer: string;
    faq_text: string;
    track_text: string;
    contact_text: string;
  };
  apply: {
    title: string;
    intro: string;
    form_fields: FormField[];
    success_message: string;
    force_insurance: boolean;
  };
  brand: {
    site_name: string;
    logo_emoji: string;
    logo_url: string;
    favicon_url: string;
    footer_text: string;
  };
  option_card_defaults: Record<Category, OptionCard[]>;
}

// ── Forbidden-word ("visa") checker for public-facing copy ────────────────────
export function hasForbiddenWord(value: string | undefined | null): boolean {
  if (!value) return false;
  return /visa/i.test(String(value));
}
export const FORBIDDEN_WARNING =
  "Forbidden word 'visa' — use e-permit / travel authorization";
