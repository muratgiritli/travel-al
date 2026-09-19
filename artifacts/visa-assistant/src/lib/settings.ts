import { useEffect, useState } from 'react';

// ─── Types (mirrors the public /settings response) ───────────────────────────

export interface InsurancePricing {
  daily_price: number;
  min_days: number;
  per_traveler: boolean;
  required_default: boolean;
  example_text: string;
}
export interface FeesPricing {
  standard_service: number;
  express: number;
  sticker_consultancy: number;
  conditional_option: number;
  gulf_support: number;
  currency: string;
  tax_enabled: boolean;
  tax_percent: number;
}
export interface PricingSettings {
  insurance: InsurancePricing;
  fees: FeesPricing;
}
export interface ChatSettings {
  welcome_message: string;
  passport_selected_message: string;
  insurance_required_message: string;
  bottom_disclaimer: string;
  faq_text: string;
  track_text: string;
  contact_text: string;
}
export interface ContentBenefit {
  title: string;
  text: string;
  icon?: string;
}
export interface ContentServices {
  entry_title: string;
  entry_subtitle: string;
  entry_title_free: string;
  entry_subtitle_free: string;
  entry_title_sticker: string;
  entry_subtitle_sticker: string;
  entry_title_direct: string;
  entry_subtitle_direct: string;
  insurance_title: string;
  insurance_subtitle: string;
  esim_title: string;
  esim_subtitle: string;
}
export interface ContentCategoryLines {
  entry_free: string;
  e_permit_direct: string;
  e_permit_conditional: string;
  age_special: string;
  sticker_mission: string;
  default: string;
}
export interface ContentCountryCard {
  title_default: string;
  for_citizens: string;
  requirements_title: string;
  passport_validity_label: string;
  passport_validity_default: string;
  max_stay_label: string;
  max_stay_fallback: string;
  insurance_row_label: string;
  insurance_required_label: string;
  status_free: string;
  status_direct: string;
  status_other: string;
}
export interface ContentInsurance {
  title: string;
  /** Short checkmark lines under the title */
  features: string[];
  daily_label: string;
  per_day_label: string;
  important_title: string;
  paragraphs: string[];
  important_note: string;
  cta_label: string;
  /** @deprecated kept for older saved settings merges */
  mandatory_title?: string;
  benefits?: ContentBenefit[];
}
export interface ContentEsimPage {
  headline: string;
  body: string;
  bullets: string[];
  choose_label: string;
  unavailable: string;
  details_label: string;
}
/** All chat / marketing copy — filled from admin, never hardcoded in UI. */
export interface ContentSettings {
  welcome_title: string;
  select_hint: string;
  type_country_placeholder: string;
  start_typing_hint: string;
  choose_service_label: string;
  ask_placeholder: string;
  status_line: string;
  insurance_badge: string;
  services: ContentServices;
  category_lines: ContentCategoryLines;
  country_card: ContentCountryCard;
  insurance: ContentInsurance;
  esim_page: ContentEsimPage;
}
export interface ApplyFormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}
export interface ApplySettings {
  title: string;
  intro: string;
  form_fields: ApplyFormField[];
  success_message: string;
  success_title: string;
  success_email_note: string;
  tracking_prefix: string;
  force_insurance: boolean;
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
export interface BrandSettings {
  site_name: string;
  logo_emoji: string;
  logo_url: string;
  favicon_url: string;
  footer_text: string;
  /** Welcome empty-state background image (URL or data URL). */
  welcome_bg_url: string;
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
/** Seller identity and policy copy required for selling online from Türkiye. */
export interface LegalSettings {
  company_name: string;
  legal_name: string;
  address: string;
  tax_office: string;
  tax_number: string;
  mersis_no: string;
  trade_registry_no: string;
  email: string;
  phone: string;
  refund_policy: string;
  distance_sales_agreement: string;
  kvkk_notice: string;
  cookie_notice: string;
}

export interface IntegrationSettings {
  plausible_domain: string;
  whatsapp_number: string;
  whatsapp_message: string;
}

export interface SiteSettings {
  pricing: PricingSettings;
  chat: ChatSettings;
  content: ContentSettings;
  apply: ApplySettings;
  brand: BrandSettings;
  esim: EsimSettings;
  trust: TrustSettings;
  legal: LegalSettings;
  integrations: IntegrationSettings;
}

/** Admin-editable offer/option card returned by GET /api/travel/countries/:id. */
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
  /** Option 1 age gate (e.g. Egypt under 15 / over 45) — APPLY NOW only when Yes */
  require_age_confirm?: boolean;
  age_confirm_info?: string;
  age_confirm_question?: string;
}

// Empty marketing copy — site bundle must not ship conversation text.
const EMPTY_CONTENT: ContentSettings = {
  welcome_title: '',
  select_hint: '',
  type_country_placeholder: '',
  start_typing_hint: '',
  choose_service_label: '',
  ask_placeholder: '',
  status_line: '',
  insurance_badge: '',
  services: {
    entry_title: '',
    entry_subtitle: '',
    entry_title_free: '',
    entry_subtitle_free: '',
    entry_title_sticker: '',
    entry_subtitle_sticker: '',
    entry_title_direct: '',
    entry_subtitle_direct: '',
    insurance_title: '',
    insurance_subtitle: '',
    esim_title: '',
    esim_subtitle: '',
  },
  category_lines: {
    entry_free: '',
    e_permit_direct: '',
    e_permit_conditional: '',
    age_special: '',
    sticker_mission: '',
    default: '',
  },
  country_card: {
    title_default: '',
    for_citizens: '',
    requirements_title: '',
    passport_validity_label: '',
    passport_validity_default: '',
    max_stay_label: '',
    max_stay_fallback: '',
    insurance_row_label: '',
    insurance_required_label: '',
    status_free: '',
    status_direct: '',
    status_other: '',
  },
  insurance: {
    title: '',
    features: [],
    daily_label: '',
    per_day_label: '',
    important_title: '',
    paragraphs: [],
    important_note: '',
    cta_label: '',
  },
  esim_page: {
    headline: '',
    body: '',
    bullets: [],
    choose_label: '',
    unavailable: '',
    details_label: '',
  },
};

// ─── Structural defaults only (no conversation copy in the frontend bundle) ─

export const DEFAULT_SETTINGS: SiteSettings = {
  pricing: {
    insurance: {
      daily_price: 5,
      min_days: 1,
      per_traveler: true,
      required_default: true,
      example_text: '',
    },
    fees: {
      standard_service: 60,
      express: 25,
      sticker_consultancy: 20,
      conditional_option: 60,
      gulf_support: 20,
      currency: 'USD',
      tax_enabled: false,
      tax_percent: 0,
    },
  },
  chat: {
    welcome_message: '',
    passport_selected_message: '',
    insurance_required_message: '',
    bottom_disclaimer: '',
    faq_text: '',
    track_text: '',
    contact_text: '',
  },
  content: EMPTY_CONTENT,
  apply: {
    title: '',
    intro: '',
    form_fields: [
      { name: 'full_name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'passport_number', label: 'Passport number', type: 'text', required: true },
      { name: 'arrival_date', label: 'Planned arrival date', type: 'date', required: false },
    ],
    success_message: '',
    success_title: '',
    success_email_note: '',
    tracking_prefix: 'TEG',
    force_insurance: true,
  },
  brand: {
    site_name: '',
    logo_emoji: '',
    logo_url: '',
    favicon_url: '',
    footer_text: '',
    welcome_bg_url: '/istanbul-welcome-bg.jpg',
  },
  trust: {
    trust_title: '',
    trust_lines: [],
    faq_title: '',
    faq: [],
  },
  esim: {
    enabled: true,
    currency: 'USD',
    intro: '',
    cta_label: '',
    cta_href: '/next',
    plans: [],
  },
  legal: {
    company_name: '',
    legal_name: '',
    address: '',
    tax_office: '',
    tax_number: '',
    mersis_no: '',
    trade_registry_no: '',
    email: '',
    phone: '',
    refund_policy: '',
    distance_sales_agreement: '',
    kvkk_notice: '',
    cookie_notice: '',
  },
  integrations: {
    plausible_domain: '',
    whatsapp_number: '',
    whatsapp_message: '',
  },
};

// ─── In-module cache + fetcher ────────────────────────────────────────────────

let cached: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;

/** Call after admin saves so the chat picks up new brand / copy. */
export function clearSettingsCache() {
  cached = null;
  inflight = null;
}

function mergeContent(d?: Partial<ContentSettings>): ContentSettings {
  const base = EMPTY_CONTENT;
  if (!d) {
    return {
      ...base,
      services: { ...base.services },
      category_lines: { ...base.category_lines },
      country_card: { ...base.country_card },
      insurance: { ...base.insurance, features: [], paragraphs: [] },
      esim_page: { ...base.esim_page, bullets: [] },
    };
  }
  const legacyFeatures =
    d.insurance?.features?.length
      ? d.insurance.features
      : (d.insurance?.benefits || []).map((b) => b.title).filter(Boolean);
  return {
    ...base,
    ...d,
    services: { ...base.services, ...(d.services ?? {}) },
    category_lines: { ...base.category_lines, ...(d.category_lines ?? {}) },
    country_card: { ...base.country_card, ...(d.country_card ?? {}) },
    insurance: {
      ...base.insurance,
      ...(d.insurance ?? {}),
      features: legacyFeatures,
      paragraphs: d.insurance?.paragraphs?.length ? d.insurance.paragraphs : [],
      important_title: d.insurance?.important_title || d.insurance?.mandatory_title || '',
      important_note: d.insurance?.important_note || '',
    },
    esim_page: {
      ...base.esim_page,
      ...(d.esim_page ?? {}),
      bullets: d.esim_page?.bullets?.length ? d.esim_page.bullets : [],
    },
  };
}

export function fetchSettings(): Promise<SiteSettings> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetch('/api/travel/settings')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('settings fetch failed'))))
    .then((d: Partial<SiteSettings>) => {
      cached = {
        pricing: { ...DEFAULT_SETTINGS.pricing, ...(d.pricing ?? {}) },
        chat: { ...DEFAULT_SETTINGS.chat, ...(d.chat ?? {}) },
        content: mergeContent(d.content),
        apply: { ...DEFAULT_SETTINGS.apply, ...(d.apply ?? {}) },
        brand: { ...DEFAULT_SETTINGS.brand, ...(d.brand ?? {}) },
        esim: {
          ...DEFAULT_SETTINGS.esim,
          ...(d.esim ?? {}),
          plans: d.esim?.plans?.length ? d.esim.plans : [],
        },
        trust: {
          ...DEFAULT_SETTINGS.trust,
          ...(d.trust ?? {}),
          trust_lines: d.trust?.trust_lines?.length ? d.trust.trust_lines : [],
          faq: d.trust?.faq?.length ? d.trust.faq : [],
        },
        legal: { ...DEFAULT_SETTINGS.legal, ...(d.legal ?? {}) },
        integrations: { ...DEFAULT_SETTINGS.integrations, ...(d.integrations ?? {}) },
      };
      return cached;
    })
    .catch(() => {
      inflight = null;
      return DEFAULT_SETTINGS;
    });
  return inflight;
}

// ─── React hook: returns defaults immediately, then live settings ────────────

export function useSettings(): { settings: SiteSettings; loaded: boolean } {
  const [settings, setSettings] = useState<SiteSettings>(cached ?? DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState<boolean>(!!cached);

  useEffect(() => {
    let active = true;
    fetchSettings().then(s => {
      if (!active) return;
      setSettings(s);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  return { settings, loaded };
}
