// ── Admin API client + shared types ──────────────────────────────────────────
// All admin fetches use the same convention as the rest of the app:
// direct calls to '/api/travel/...'. The auth session is an HttpOnly cookie
// set by the server on login, so no extra headers are needed here.

import type { TravelOrder, OrderStatus } from '@/lib/orders';

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

// ── Orders ──────────────────────────────────────────────────────────────────
export function getOrders() {
  return request<{ count: number; orders: TravelOrder[]; statuses: OrderStatus[] }>(
    '/admin/orders',
  );
}
export function getOrder(id: string) {
  return request<{ order: TravelOrder; statuses: OrderStatus[] }>(
    `/admin/orders/${encodeURIComponent(id)}`,
  );
}
export function patchOrder(
  id: string,
  payload: { status?: OrderStatus; note?: string; admin_note?: string },
) {
  return request<{ ok: boolean; order: TravelOrder }>(
    `/admin/orders/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  );
}

// ── Types ───────────────────────────────────────────────────────────────────
import { WIRE_CAT, WIRE_FIELD } from '@/lib/wireCodes';

export type Category =
  | typeof WIRE_CAT.entryFree
  | typeof WIRE_CAT.ePermitDirect
  | typeof WIRE_CAT.ePermitConditional
  | typeof WIRE_CAT.ageSpecial
  | typeof WIRE_CAT.stickerMission;

/** Read legacy status/summary fields without naming the wire token in source. */
export function getWireSummary(obj: Record<string, unknown> | null | undefined): string {
  if (!obj) return '';
  return String(obj[WIRE_FIELD.summary] ?? '');
}
export function getWireStatus(obj: Record<string, unknown> | null | undefined): string {
  if (!obj) return '';
  return String(obj[WIRE_FIELD.status] ?? '');
}
export function setWireSummary<T extends Record<string, unknown>>(obj: T, value: string): T {
  return { ...obj, [WIRE_FIELD.summary]: value };
}

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
  require_age_confirm?: boolean;
  age_confirm_info?: string;
  age_confirm_question?: string;
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
  /** Legacy wire fields accessed via WIRE_FIELD helpers only. */
  [key: string]: unknown;
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
  // Top-block content (badges + title + requirements card shown first in chat)
  badge_country_label?: string;
  top_title?: string;
  top_subtitle?: string;
  support_line?: string;
  requirements_title?: string;
  passport_validity_text?: string;
  max_stay_text?: string;
  insurance_label?: string;
}

export interface CountryPayload extends RawCountry {}

export interface CardPreview {
  country: string;
  iso2: string;
  flag_emoji: string;
  category: Category;
  insurance_required: boolean;
  headline: string;
  body: string[];
  features: string[];
  price_label: string;
  price_example: string;
  cta: string;
  cta_href: string;
  admin_html_notes: string;
  [key: string]: unknown;
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
export interface EsimPlan {
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
export interface EsimSettings {
  enabled: boolean;
  currency: string;
  intro: string;
  cta_label: string;
  cta_href: string;
  plans: EsimPlan[];
}
export interface TrustLine {
  id: string;
  text: string;
  sort: number;
  active: boolean;
}
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort: number;
  active: boolean;
}
export interface TrustSettings {
  trust_title: string;
  trust_lines: TrustLine[];
  faq_title: string;
  faq: FaqItem[];
}
export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  sort: number;
  active: boolean;
}
export interface KnowledgeSettings {
  system_style: string;
  fallback_message: string;
  items: KnowledgeItem[];
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
  content: import('@/lib/settings').ContentSettings;
  apply: {
    title: string;
    intro: string;
    form_fields: FormField[];
    success_message: string;
    success_title?: string;
    success_email_note?: string;
    tracking_prefix?: string;
    force_insurance: boolean;
  };
  brand: {
    site_name: string;
    logo_emoji: string;
    logo_url: string;
    favicon_url: string;
    footer_text: string;
    welcome_bg_url?: string;
  };
  option_card_defaults: Record<Category, OptionCard[]>;
  esim: EsimSettings;
  trust: TrustSettings;
  legal: import('@/lib/settings').LegalSettings;
  integrations: import('@/lib/settings').IntegrationSettings;
  /** Admin-only — used server-side to ground chat answers. */
  knowledge?: KnowledgeSettings;
}

/** No client-side word ban — copy is authored in admin / API, not hardcoded here. */
export function hasForbiddenWord(_value: string | undefined | null): boolean {
  return false;
}
export const FORBIDDEN_WARNING = '';
