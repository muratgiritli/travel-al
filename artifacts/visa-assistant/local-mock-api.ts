import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { CONTENT_SEED, SCHENGEN_RESIDENCE_TAGS } from '../api-server/src/lib/contentSeed';
import { KNOWLEDGE_SEED } from '../api-server/src/lib/knowledgeSeed';

type AgeBand = { label?: string; status?: string; detail?: string };

type RawCountry = {
  id: string;
  name: string;
  name_tr?: string;
  iso2: string;
  flag_emoji: string;
  visa_summary?: string;
  stay_rule?: string;
  insurance_required?: boolean;
  fee_free?: boolean;
  max_stay_text?: string;
  headline?: string;
  features?: string[];
  price_label?: string;
  price_example?: string;
  cta?: string;
  cta_href?: string;
  category?: string;
  is_active?: boolean;
  age_bands?: AgeBand[];
  option_cards?: OptionCardDef[];
};

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadCountries(dataDir: string) {
  const files = [
    ['visa-exempt-countries.json', 'visa_exempt'],
    ['evisa-direct-countries.json', 'evisa_direct'],
    ['evisa-conditional-countries.json', 'evisa_conditional'],
    ['age-special-countries.json', 'age_special'],
    ['sticker-mission-countries.json', 'sticker_mission'],
  ] as const;

  const all: RawCountry[] = [];
  for (const [file, category] of files) {
    const full = path.join(dataDir, file);
    if (!fs.existsSync(full)) continue;
    const data = readJson(full);
    const defaults = data.defaults || {};
    for (const c of data.countries || []) {
      all.push({
        ...defaults,
        ...c,
        category: c.category || data.category || category,
      });
    }
  }
  return all.filter((c) => c.is_active !== false);
}

function buildCard(country: RawCountry) {
  return {
    top_block: {
      badge_country_label: country.name.toUpperCase(),
      title: 'Get Your Travel E-VISA',
      subtitle: `for ${country.name} Citizens`,
      support_line: country.visa_summary || '',
      requirements_title: 'Travel Requirements for Turkey:',
      passport_validity_text: 'Minimum 180 days',
      max_stay_text: country.max_stay_text || 'See details below',
      insurance_label: country.insurance_required === false ? 'Optional' : 'Required',
    },
    country: country.name,
    iso2: country.iso2,
    flag_emoji: country.flag_emoji,
    category: country.category,
    visa_status: country.visa_summary || '',
    insurance_required: country.insurance_required !== false,
    fee_free: !!country.fee_free,
    headline: country.headline || 'Travel insurance is required for your stay',
    body: [
      country.stay_rule || '',
      country.insurance_required === false
        ? ''
        : 'Travel health insurance is mandatory for the full duration of your stay.',
    ].filter(Boolean),
    features: country.features || [],
    price_label: country.price_label || 'Standard Plan • $5 / day',
    price_example: country.price_example || 'Example: 10 days × 1 traveler = $50',
    cta: country.cta || 'Get travel insurance',
    cta_href: country.cta_href || '/checkout',
    admin_html_notes: '',
  };
}

type OptionCardDef = {
  id: string;
  title: string;
  description: string;
  condition?: string;
  eligible_tags?: string[];
  price: number;
  currency?: string;
  sort: number;
  active: boolean;
  require_age_confirm?: boolean;
  age_confirm_info?: string;
  age_confirm_question?: string;
  cta_label: string;
  cta_href: string;
  bullets?: string[];
};

const OPTION_CARD_DEFAULTS: Record<string, OptionCardDef[]> = {
  evisa_conditional: [
    {
      id: 'resident',
      title: 'Get a Turkey e-Permit',
      description: 'If you have a valid residence permit in any of the following countries:',
      condition: '',
      eligible_tags: [...SCHENGEN_RESIDENCE_TAGS],
      price: 60,
      sort: 1,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days.',
      ],
    },
    {
      id: 'valid-permit',
      title: 'Get a Turkey e-Permit',
      description: 'If you have a valid entry permit to any of the following countries:',
      condition: '',
      eligible_tags: ['EU Schengen Area', 'US United States', 'GB United Kingdom', 'IE Ireland'],
      price: 60,
      sort: 2,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'If you hold a valid physical entry permit from the Schengen Area, USA, UK, or Ireland, you are eligible for an easy online e-Permit. Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days.',
      ],
    },
    {
      id: 'gcc',
      title: 'Get a Turkey Entry Permit',
      description: 'If you have a valid residence permit to any of the following countries:',
      condition: '',
      eligible_tags: ['AE UAE', 'SA Saudi Arabia', 'QA Qatar', 'KW Kuwait', 'OM Oman', 'BH Bahrain'],
      price: 60,
      sort: 3,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'Citizens holding a valid residence permit from one of the following countries are eligible to apply for a Turkey entry permit for holiday purposes. This streamlines the process, offering a 30-day stay in Turkey. Your application and information details will be sent to your email address within the same day.',
      ],
    },
    {
      id: 'sticker',
      title: 'Get a Turkey Entry Permit',
      description: 'If you do not qualify for an online e-Permit option:',
      condition: '',
      eligible_tags: ['Document preparation', 'Embassy appointment', 'Form & biometric support', 'Application tracking'],
      price: 20,
      sort: 4,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'If you do not qualify for an online e-Permit, our consultancy supports a Turkey entry permit through the embassy / consulate sticker process. We guide you on documents, appointments, forms and biometrics. Application details and next steps are sent to your email.',
      ],
    },
  ],
  age_special: [
    {
      id: 'age-direct',
      title: 'Get a Turkey e-Permit',
      description: 'Direct e-Permit for eligible age groups.',
      price: 60,
      sort: 1,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: ['e-Permit + travel info delivered by email.', 'Delivery between 60 minutes and 7 days.'],
      require_age_confirm: true,
      age_confirm_info:
        'Under 15 and over 45 can apply for a direct e-Permit without additional permit conditions.',
      age_confirm_question: 'Are you under 15 or over 45?',
    },
    {
      id: 'age-permit',
      title: 'Get a Turkey e-Permit',
      description: 'With a valid entry permit for an eligible country.',
      condition: 'Valid physical entry permit from the Schengen Area, USA, UK or Ireland required.',
      eligible_tags: ['EU Schengen Area', 'US United States', 'GB United Kingdom', 'IE Ireland'],
      price: 60,
      sort: 2,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'If you hold a valid physical entry permit from the Schengen Area, USA, UK, or Ireland, you are eligible for an easy online e-Permit. Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days.',
      ],
    },
    {
      id: 'gcc',
      title: 'Get a Turkey Entry Permit',
      description: 'If you have a valid residence permit to any of the following countries:',
      condition: '',
      eligible_tags: ['AE UAE', 'SA Saudi Arabia', 'QA Qatar', 'KW Kuwait', 'OM Oman', 'BH Bahrain'],
      price: 60,
      sort: 3,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'Citizens holding a valid residence permit from one of the following countries are eligible to apply for a Turkey entry permit for holiday purposes. This streamlines the process, offering a 30-day stay in Turkey. Your application and information details will be sent to your email address within the same day.',
      ],
    },
    {
      id: 'sticker',
      title: 'Get a Turkey Entry Permit',
      description: 'If you do not qualify for an online e-Permit option:',
      condition: '',
      eligible_tags: ['Document preparation', 'Embassy appointment', 'Form & biometric support', 'Application tracking'],
      price: 20,
      sort: 4,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'If you do not qualify for an online e-Permit, our consultancy supports a Turkey entry permit through the embassy / consulate sticker process. We guide you on documents, appointments, forms and biometrics. Application details and next steps are sent to your email.',
      ],
    },
  ],
  sticker_mission: [
    {
      id: 'consultancy',
      title: 'Get a Turkey Entry Permit',
      description: 'If you do not qualify for an online e-Permit option:',
      condition: '',
      eligible_tags: ['Document preparation', 'Embassy appointment', 'Form & biometric support', 'Application tracking'],
      price: 20,
      sort: 1,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'If you do not qualify for an online e-Permit, our consultancy supports a Turkey entry permit through the embassy / consulate sticker process. We guide you on documents, appointments, forms and biometrics. Application details and next steps are sent to your email.',
      ],
    },
    {
      id: 'gcc',
      title: 'Get a Turkey Entry Permit',
      description: 'If you have a valid residence permit to any of the following countries:',
      condition: '',
      eligible_tags: ['AE UAE', 'SA Saudi Arabia', 'QA Qatar', 'KW Kuwait', 'OM Oman', 'BH Bahrain'],
      price: 60,
      sort: 2,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'Citizens holding a valid residence permit from one of the following countries are eligible to apply for a Turkey entry permit for holiday purposes. This streamlines the process, offering a 30-day stay in Turkey. Your application and information details will be sent to your email address within the same day.',
      ],
    },
  ],
  evisa_direct: [
    {
      id: 'direct',
      title: 'Get a Turkey e-Permit',
      description: 'Online e-Permit for your passport — apply here in the assistant.',
      price: 60,
      sort: 1,
      active: true,
      cta_label: 'APPLY NOW',
      cta_href: '/next',
      bullets: [
        'Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days.',
      ],
    },
  ],
  visa_exempt: [],
};

function enrichAgeDirectCard(card: OptionCardDef, country: RawCountry): OptionCardDef {
  if (card.id !== 'age-direct') return card;
  const bands = country.age_bands || [];
  const band = bands.find((b) => b.status === 'direct_evisa') || bands[0];
  if (!band?.label) {
    return { ...card, require_age_confirm: card.require_age_confirm ?? true };
  }
  return {
    ...card,
    require_age_confirm: true,
    age_confirm_info: `${band.label} can apply for a direct e-Permit without additional permit conditions.`,
    age_confirm_question: `Are you in this age group (${band.label})?`,
  };
}

function optionCardsFor(country: RawCountry): OptionCardDef[] {
  const category = String(country.category || '');
  const own = country.option_cards;
  const cards = own && own.length > 0 ? own : OPTION_CARD_DEFAULTS[category] || [];
  return cards
    .filter((c) => c.active !== false)
    .sort((a, b) => a.sort - b.sort)
    .map((c) => enrichAgeDirectCard({ ...c, currency: c.currency || 'USD' }, country));
}

const defaultSettings = {
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
    welcome_message:
      'Check your entry requirements, choose the travel services that suit your needs, and complete your application with instant AI\u00A0assistance.',
    passport_selected_message: 'Passport selected.',
    insurance_required_message:
      'Travel health insurance is mandatory for the full duration of your stay.',
    bottom_disclaimer: '',
    faq_text: 'Frequently asked questions about travelling to Türkiye.',
    track_text: 'Track your application status here.',
    contact_text: 'Contact our travel experts — we reply within 24 hours.',
  },
  content: CONTENT_SEED,
  apply: {
    title: 'Start your application',
    intro: 'Fill in your details and our team will process your e-Permit.',
    form_fields: [
      { name: 'full_name', label: 'Full name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'passport_number', label: 'Passport number', type: 'text', required: true },
    ],
    success_message: 'Application received! Check your email for the next steps.',
    success_title: 'Application received',
    success_email_note: 'A confirmation was sent to {email}. Keep your tracking number for status updates.',
    tracking_prefix: 'TEG',
    force_insurance: true,
  },
  brand: {
    site_name: 'Türkiye Entry Guide',
    logo_emoji: '🇹🇷',
    logo_url: '',
    favicon_url: '',
    footer_text: 'Independent travel assistance service.',
    welcome_bg_url: '/istanbul-welcome-bg.jpg',
  },
  trust: {
    trust_title: 'Why travelers choose us',
    trust_lines: [],
    faq_title: 'FAQ',
    faq: [
      {
        id: 'f1',
        question: 'What does Schengen mean?',
        answer:
          'Schengen is a group of European countries with shared border rules. A valid Schengen residence permit or entry stamp can help some travelers qualify for a Türkiye e-Permit option.',
        sort: 1,
        active: true,
      },
      {
        id: 'f2',
        question: 'How long does delivery take?',
        answer:
          'Depending on the processing speed you choose, delivery typically occurs between 60 minutes and 7 days. Details are sent to your email.',
        sort: 2,
        active: true,
      },
      {
        id: 'f3',
        question: 'Do I need travel insurance?',
        answer:
          'Travel health insurance covering your full stay in Türkiye is required or strongly advised for most travelers, including many entry-free nationalities.',
        sort: 3,
        active: true,
      },
    ],
  },
  esim: {
    enabled: true,
    currency: 'USD',
    intro: 'Türkiye için eSIM veri paketleri. Ödeme sonrası dakikalar içinde QR ile kurulum.',
    cta_label: 'BUY eSIM',
    cta_href: '/next',
    plans: [
      { id: 'tr-1gb-7d', name: 'Turkey 1 GB', data_label: '1 GB', validity_days: 7, price: 4.5, network: 'Turkcell', hotspot: true, coverage: 'Türkiye', features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'], details: 'Kısa ziyaretler için ideal başlangıç paketi. Ödeme sonrası eSIM QR kodu e-posta ile iletilir; telefonunuzda birkaç dakikada aktif edilir.', sort: 1, active: true },
      { id: 'tr-2gb-15d', name: 'Turkey 2 GB', data_label: '2 GB', validity_days: 15, price: 6.5, network: 'Turkcell', hotspot: true, coverage: 'Türkiye', features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'], details: '1–2 haftalık seyahatler için dengeli paket. Harita, mesajlaşma ve günlük kullanım için uygundur.', sort: 2, active: true },
      { id: 'tr-3gb-30d', name: 'Turkey 3 GB', data_label: '3 GB', validity_days: 30, price: 8.5, network: 'Turkcell', hotspot: true, coverage: 'Türkiye', features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'], details: 'Aylık geçerlilikli ekonomik paket. Orta düzey veri ihtiyacı olan gezginler için uygundur.', sort: 3, active: true },
      { id: 'tr-5gb-30d', name: 'Turkey 5 GB', data_label: '5 GB', validity_days: 30, price: 12, network: 'Turkcell', hotspot: true, coverage: 'Türkiye', features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'], details: 'Şehir + sahil turları için popüler seçenek. Sosyal medya ve navigasyon kullanımına rahat eder.', sort: 4, active: true },
      { id: 'tr-10gb-30d', name: 'Turkey 10 GB', data_label: '10 GB', validity_days: 30, price: 18, network: 'Turkcell', hotspot: true, coverage: 'Türkiye', features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'], details: 'Yoğun kullanım ve hotspot ihtiyacı için önerilir. Uzun tatillerde güvenli veri kotası sağlar.', sort: 5, active: true },
      { id: 'tr-20gb-30d', name: 'Turkey 20 GB', data_label: '20 GB', validity_days: 30, price: 26, network: 'Turkcell', hotspot: true, coverage: 'Türkiye', features: ['QR ile anında kurulum', 'LTE / 5G', 'Hotspot destekli'], details: 'Yüksek veri ihtiyacı veya birden fazla cihaz paylaşımı için premium paket.', sort: 6, active: true },
    ],
  },
  knowledge: KNOWLEDGE_SEED,
};

function pickLocalKnowledge(message: string): string {
  const store = (settingsStoreRef?.knowledge || KNOWLEDGE_SEED) as typeof KNOWLEDGE_SEED;
  const items = (store.items || []).filter((it) => it.active !== false);
  const q = String(message || '').toLowerCase();
  const tokens = q.split(/[^a-z0-9çğıöşü]+/i).filter((t) => t.length > 2);
  let best: { answer: string; score: number } | null = null;
  for (const item of items) {
    const tags = (item.tags || []).map((t) => String(t).toLowerCase());
    const hay = `${item.question} ${item.answer} ${tags.join(' ')}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    for (const tag of tags) if (tag && q.includes(tag)) score += 2;
    if (!best || score > best.score) best = { answer: item.answer, score };
  }
  if (best && best.score > 0) return best.answer;
  return store.fallback_message || KNOWLEDGE_SEED.fallback_message;
}

/** Mutable ref so pickLocalKnowledge can read latest admin saves. */
let settingsStoreRef: Record<string, unknown> | null = null;

const LOCAL_ORDER_STATUSES = [
  'new', 'paid', 'approved', 'processing', 'sent', 'completed', 'rejected', 'cancelled',
] as const;
type LocalOrderStatus = (typeof LOCAL_ORDER_STATUSES)[number];
type LocalOrder = {
  id: string;
  created_at: string;
  updated_at: string;
  type: string;
  status: LocalOrderStatus;
  status_history: { status: LocalOrderStatus; at: string; note?: string }[];
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  customer_name?: string;
  country?: string;
  option_id?: string;
  option_title?: string;
  option_index?: number;
  summary?: string;
  payload: Record<string, unknown>;
  payment?: { method: string; cardholder?: string; last4?: string; submitted_at: string };
  admin_note?: string;
};
let localOrders: LocalOrder[] = [];

function readJsonBody(req: { on: (e: string, cb: (c?: unknown) => void) => void }): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}') as Record<string, unknown>); }
      catch { resolve({}); }
    });
  });
}

function deepMergeLocal(base: unknown, over: unknown): unknown {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return over === undefined ? base : over;
  if (!base || typeof base !== 'object' || Array.isArray(base)) return over;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    out[k] = deepMergeLocal((base as Record<string, unknown>)[k], v);
  }
  return out;
}

/** Lightweight local API so UI can run without Postgres. */
export function localMockApi(): Plugin {
  const dataDir = path.resolve(import.meta.dirname, '..', 'api-server', 'data', 'visa');
  let countries = loadCountries(dataDir);
  let settingsStore: Record<string, unknown> = { ...defaultSettings };
  settingsStoreRef = settingsStore;

  return {
    name: 'local-mock-api',
    configureServer(server) {
      server.watcher.add(dataDir);
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (!url.startsWith('/api/travel')) return next();

        // Refresh on each request while developing
        countries = loadCountries(dataDir);
        settingsStoreRef = settingsStore;

        // ── Local admin (open preview — no real auth) ──
        if (url === '/api/travel/admin/session' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true, username: 'local' }));
          return;
        }
        if (url === '/api/travel/admin/login' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
          return;
        }
        if (url === '/api/travel/admin/logout' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
          return;
        }
        if (url === '/api/travel/admin/settings' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ settings: settingsStore, defaults: defaultSettings }));
          return;
        }
        if (url === '/api/travel/admin/settings' && req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const patch = JSON.parse(body || '{}') as Record<string, unknown>;
              settingsStore = deepMergeLocal(settingsStore, patch) as Record<string, unknown>;
              settingsStoreRef = settingsStore;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, settings: settingsStore }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (url === '/api/travel/orders' && req.method === 'POST') {
          void readJsonBody(req).then((body) => {
            const now = new Date().toISOString();
            const payment = body.payment && typeof body.payment === 'object'
              ? body.payment as { cardholder?: string; last4?: string }
              : undefined;
            const status: LocalOrderStatus = payment || body.mark_paid ? 'paid' : 'new';
            const order: LocalOrder = {
              id: `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
              created_at: now,
              updated_at: now,
              type: String(body.type || 'entry'),
              status,
              status_history: [{ status, at: now, note: 'Order created' }],
              amount: Number(body.amount) || 0,
              currency: String(body.currency || 'USD'),
              email: String(body.email || ''),
              phone: body.phone ? String(body.phone) : undefined,
              customer_name: body.customer_name ? String(body.customer_name) : undefined,
              country: body.country ? String(body.country) : undefined,
              option_id: body.option_id ? String(body.option_id) : undefined,
              option_title: body.option_title ? String(body.option_title) : undefined,
              option_index: typeof body.option_index === 'number' ? body.option_index : undefined,
              summary: body.summary ? String(body.summary) : undefined,
              payload: (body.payload && typeof body.payload === 'object'
                ? body.payload
                : {}) as Record<string, unknown>,
              payment: payment
                ? {
                    method: 'card_form',
                    cardholder: payment.cardholder,
                    last4: payment.last4,
                    submitted_at: now,
                  }
                : undefined,
            };
            localOrders.unshift(order);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, order: { id: order.id, status: order.status, amount: order.amount } }));
          });
          return;
        }

        if (url === '/api/travel/admin/orders' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            count: localOrders.length,
            orders: localOrders,
            statuses: LOCAL_ORDER_STATUSES,
          }));
          return;
        }

        if (url.startsWith('/api/travel/admin/orders/') && req.method === 'GET') {
          const id = decodeURIComponent(url.split('/api/travel/admin/orders/')[1] || '');
          const order = localOrders.find((o) => o.id === id);
          if (!order) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Order not found' }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ order, statuses: LOCAL_ORDER_STATUSES }));
          return;
        }

        if (url.startsWith('/api/travel/admin/orders/') && req.method === 'PATCH') {
          const id = decodeURIComponent(url.split('/api/travel/admin/orders/')[1] || '');
          void readJsonBody(req).then((body) => {
            const idx = localOrders.findIndex((o) => o.id === id);
            if (idx < 0) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Order not found' }));
              return;
            }
            const now = new Date().toISOString();
            let order = localOrders[idx];
            if (body.admin_note !== undefined) {
              order = { ...order, admin_note: String(body.admin_note ?? ''), updated_at: now };
            }
            if (body.status !== undefined) {
              const status = String(body.status) as LocalOrderStatus;
              if (!(LOCAL_ORDER_STATUSES as readonly string[]).includes(status)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid status' }));
                return;
              }
              order = {
                ...order,
                status,
                updated_at: now,
                status_history: [
                  ...(order.status_history || []),
                  { status, at: now, note: body.note ? String(body.note) : undefined },
                ],
              };
            }
            localOrders[idx] = order;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, order }));
          });
          return;
        }

        if (url.startsWith('/api/travel/settings')) {
          // Keep knowledge bank off the public settings payload
          const { knowledge: _k, ...pub } = settingsStore as Record<string, unknown> & { knowledge?: unknown };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(pub));
          return;
        }

        if (url.startsWith('/api/travel/countries/') && req.method === 'GET') {
          const id = decodeURIComponent(url.split('/api/travel/countries/')[1]?.split('?')[0] || '');
          const country = countries.find((c) => c.id === id || c.iso2?.toLowerCase() === id.toLowerCase());
          if (!country) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Country not found' }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            country,
            card: buildCard(country),
            option_cards: optionCardsFor(country),
            pricing: defaultSettings.pricing,
          }));
          return;
        }

        if (url.startsWith('/api/travel/countries') && req.method === 'GET') {
          const list = countries
            .map((c) => ({
              id: c.id,
              name: c.name,
              name_tr: c.name_tr,
              iso2: c.iso2,
              flag_emoji: c.flag_emoji,
              category: c.category,
              visa_summary: c.visa_summary,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ count: list.length, countries: list }));
          return;
        }

        if (url.startsWith('/api/travel/chat') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            let message = '';
            try { message = JSON.parse(body || '{}').message || ''; } catch { /* ignore */ }
            res.setHeader('Content-Type', 'text/event-stream');
            const reply = pickLocalKnowledge(message);
            res.end(`data: ${reply.replace(/\n/g, '\\n')}\n\ndata: [DONE]\n\n`);
          });
          return;
        }

        next();
      });
    },
  };
}
