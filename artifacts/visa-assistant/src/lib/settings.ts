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
  force_insurance: boolean;
}
export interface BrandSettings {
  site_name: string;
  logo_emoji: string;
  logo_url: string;
  favicon_url: string;
  footer_text: string;
}
export interface SiteSettings {
  pricing: PricingSettings;
  chat: ChatSettings;
  apply: ApplySettings;
  brand: BrandSettings;
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
}

// ─── Inline defaults (fallback so pages render before fetch resolves) ─────────

export const DEFAULT_SETTINGS: SiteSettings = {
  pricing: {
    insurance: {
      daily_price: 5,
      min_days: 1,
      per_traveler: true,
      required_default: true,
      example_text: 'Example: 10 days × $5/day = $50 per traveler.',
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
    welcome_message: 'Which country issued your passport?',
    passport_selected_message: 'Passport selected.',
    insurance_required_message: 'Travel health insurance is mandatory for the full duration of your stay.',
    bottom_disclaimer: 'AI travel assistant • Human experts available',
    faq_text: 'Frequently asked questions about travelling to Türkiye.',
    track_text: 'Track your application status here.',
    contact_text: 'Contact our travel experts — we reply within 24 hours.',
  },
  apply: {
    title: 'Start your application',
    intro: 'Fill in your details and our team will process your travel authorization.',
    form_fields: [
      { name: 'full_name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'passport_number', label: 'Passport number', type: 'text', required: true },
      { name: 'arrival_date', label: 'Planned arrival date', type: 'date', required: false },
    ],
    success_message: 'Application received! Check your email for the next steps.',
    force_insurance: true,
  },
  brand: {
    site_name: 'Turkey Travel Assistant',
    logo_emoji: '🕌',
    logo_url: '',
    favicon_url: '',
    footer_text: 'Turkey Travel Assistant — independent travel consultancy.',
  },
};

// ─── In-module cache + fetcher ────────────────────────────────────────────────

let cached: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;

export function fetchSettings(): Promise<SiteSettings> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetch('/api/travel/settings')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('settings fetch failed'))))
    .then((d: Partial<SiteSettings>) => {
      cached = {
        pricing: { ...DEFAULT_SETTINGS.pricing, ...(d.pricing ?? {}) },
        chat: { ...DEFAULT_SETTINGS.chat, ...(d.chat ?? {}) },
        apply: { ...DEFAULT_SETTINGS.apply, ...(d.apply ?? {}) },
        brand: { ...DEFAULT_SETTINGS.brand, ...(d.brand ?? {}) },
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
