import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion, Reorder, useDragControls } from 'framer-motion';
import OptionCards from '@/components/OptionCards';
import EntryApplyForm from '@/components/EntryApplyForm';
import StickerApplyForm from '@/components/StickerApplyForm';
import ServiceHub, { type ServiceId } from '@/components/ServiceHub';
import EsimPlans from '@/components/EsimPlans';
import InsuranceInfo from '@/components/InsuranceInfo';
import TrustFaq from '@/components/TrustFaq';
import SiteFooter from '@/components/SiteFooter';
import type { ContentSettings, OptionCard } from '@/lib/settings';
import {
  readSessionHistory,
  writeSessionHistory,
  upsertSessionInHistory,
  removeSessionFromHistory,
  SessionEntry,
} from '@/lib/sessionHistory';
import { useSettings } from '@/lib/settings';
import { WIRE_CAT, WIRE_FIELD, type WireCategory } from '@/lib/wireCodes';
import { useI18n, getSiteCopy, localizeEntryCard, localizeOptionCards, localizeStaySnippet } from '@/lib/i18n';
import type { LangCode } from '@/lib/i18n';

function wireStatus(card: Record<string, unknown> | null | undefined): string {
  if (!card) return '';
  return String(card[WIRE_FIELD.status] ?? '');
}

/** Nar çiçeği — primary action buttons */
const BTN = '#C73E54';
const BTN_DARK = '#A82E42';

/** Compact Turkish flag mark (red + white crescent/star) */
function TurkeyFlagLogo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden relative"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#E30A17',
        border: '1px solid rgba(255,255,255,.25)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.06)',
      }}
      aria-hidden
    >
      <svg viewBox="0 0 36 36" width={size} height={size} className="block">
        {/* Crescent */}
        <circle cx="14.8" cy="18" r="7.6" fill="#fff" />
        <circle cx="17.2" cy="18" r="6.1" fill="#E30A17" />
        {/* Star — smaller, closer to crescent tip */}
        <polygon
          fill="#fff"
          transform="translate(23.4,18) rotate(-10) scale(0.42) translate(-12,-12)"
          points="12,2.5 14.4,9.2 21.5,9.2 15.8,13.4 18.1,20.2 12,15.9 5.9,20.2 8.2,13.4 2.5,9.2 9.6,9.2"
        />
      </svg>
    </div>
  );
}

interface Country {
  id: string; name: string; name_tr?: string; iso2: string; flag_emoji: string;
  category: WireCategory;
}

interface TopBlockData {
  badge_country_label?: string;
  title?: string;
  subtitle?: string;
  support_line?: string;
  requirements_title?: string;
  passport_validity_text?: string;
  max_stay_text?: string;
  insurance_label?: string;
}

interface EntryCardData {
  top_block?: TopBlockData;
  country: string; iso2: string; flag_emoji: string;
  category: WireCategory;
  insurance_required: boolean;
  headline: string; body: string[];
  features: string[]; price_label: string; price_example: string;
  cta: string; cta_href: string;
  admin_html_notes: string;
  [key: string]: unknown;
}

interface ChatMessage {
  role: 'bot' | 'user' | 'system';
  text: string;
  /** When set, UI renders t(i18nKey, i18nVars) so language switches update live */
  i18nKey?: string;
  i18nVars?: Record<string, string | number>;
  card?: EntryCardData | null;
  optionCards?: OptionCard[];
  /** After country select: show service frames (entry / insurance / eSIM) */
  showServices?: boolean;
  activeService?: ServiceId | null;
}

function DragHandle({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <div
      onPointerDown={(e) => {
        e.preventDefault();
        controls.start(e);
      }}
      className="flex flex-col gap-[3px] cursor-grab active:cursor-grabbing p-1.5 shrink-0 touch-none"
      aria-label="Drag to reorder"
      title="Drag to reorder"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3.5 h-[2px] rounded-full"
          style={{ background: '#9ca3af' }}
        />
      ))}
    </div>
  );
}
// ── Top header block: badges + title + requirements card ──
// Shown first on EVERY country result, above category content and CTAs.

/** Category-specific supporting line under the title (from admin content). */
function supportingLine(category: WireCategory, lines: ContentSettings['category_lines']): string {
  switch (category) {
    case WIRE_CAT.entryFree: return lines.entry_free;
    case WIRE_CAT.ePermitDirect: return lines.e_permit_direct;
    case WIRE_CAT.ePermitConditional: return lines.e_permit_conditional;
    case WIRE_CAT.ageSpecial: return lines.age_special;
    case WIRE_CAT.stickerMission: return lines.sticker_mission;
    default: return lines.default;
  }
}

/** Derive the "Maximum stay" text from the country record (status / stay rule). */
function maxStayText(card: EntryCardData): string {
  // Status often looks like "e-Permit • 90 days multiple entry" or
  // "Permit-free entry • 90 days / 180". Only accept the bullet suffix when it
  // is a recognizable stay-duration pattern — never unrelated numeric text.
  const status = wireStatus(card);
  const afterDot = status.split('•').slice(1).join('•').trim();
  const durationLike = /^\d+\s*(days?|months?)\b|^\d+\s*\/\s*\d+/i;
  if (afterDot && durationLike.test(afterDot)) return capitalize(afterDot);
  // Fall back to scanning the stay rule / status text for "<n> days ..."
  const rule = card.body?.[0] || '';
  const m = rule.match(/(\d+)[- ]day(?:s)?(?:[^.]*?\b(single|multiple)[- ]entry)?/i)
    || status.match(/(\d+)[- ]day(?:s)?(?:[^.]*?\b(single|multiple)[- ]entry)?/i);
  if (m) {
    const entry = m[2] ? `, ${capitalize(m[2].toLowerCase())} Entry` : '';
    return `${m[1]} Days${entry}`;
  }
  return '';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function CountryTopBlock({ card, content }: { card: EntryCardData; content: ContentSettings }) {
  const { lang } = useI18n();
  const tb = card.top_block || {};
  const cc = content.country_card;
  const forCitizens = (cc.for_citizens || '').replace('{country}', card.country);
  const rawStay = tb.max_stay_text || maxStayText(card);
  const stay =
    (rawStay && /see details below/i.test(rawStay)
      ? cc.max_stay_fallback
      : localizeStaySnippet(rawStay, lang)) || cc.max_stay_fallback;
  return (
    <div
      className="rounded-2xl p-4 shadow-sm mt-2 ml-10 min-w-0"
      style={{ background: '#fff', border: '1px solid #e5e7eb', maxWidth: 'calc(100% - 2.5rem)', overflowWrap: 'anywhere' }}
    >
      {/* 1) Badges row */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-white"
          style={{ background: '#E30A17', border: '1px solid #E30A17' }}
        >
          🇹🇷 TURKEY
        </span>
        <span className="text-gray-400 text-[13px] font-bold">+</span>
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-white"
          style={{ background: '#0a1f44', border: '1px solid #0a1f44' }}
        >
          {card.flag_emoji} {tb.badge_country_label || card.country.toUpperCase()}
        </span>
      </div>

      {/* 2) Title — chrome from localized site copy */}
      <div className="text-center mb-4">
        <h1 className="font-black text-[19px] text-gray-900 leading-tight">
          {cc.title_default}
        </h1>
        <div className="font-semibold text-[14px] text-gray-700 mt-0.5">
          {forCitizens}
        </div>
        <div className="text-[12px] text-gray-500 mt-1">
          {supportingLine(card.category, content.category_lines)}
        </div>
      </div>

      {/* 3) Requirements card — title must never contain a year */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
      >
        <div className="px-4 pt-3 pb-2 font-bold text-[13px] text-gray-900">
          {cc.requirements_title}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid #eef1f5' }}>
            <span className="text-[13px] text-gray-500">{cc.passport_validity_label}</span>
            <span className="text-[13px] font-semibold text-gray-900">{tb.passport_validity_text || cc.passport_validity_default}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 gap-3" style={{ borderTop: '1px solid #eef1f5' }}>
            <span className="text-[13px] text-gray-500 shrink-0">{cc.max_stay_label}</span>
            <span className="text-[13px] font-semibold text-gray-900 text-right min-w-0 break-words">{stay}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid #eef1f5' }}>
            <span className="text-[13px] text-gray-500">{cc.insurance_row_label}</span>
            <span
              className="text-[12px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
            >
              {tb.insurance_label || cc.insurance_required_label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EntryCard({ card }: { card: EntryCardData; content: ContentSettings }) {
  return (
    <div
      className="rounded-2xl p-4 shadow-sm mt-2 mx-auto w-full"
      style={{ background: '#fff', border: '1px solid #e5e7eb', maxWidth: '100%' }}
    >
      {/* Headline — flags/status live in the top block above */}
      <h2 className="font-semibold text-[15px] text-gray-900 mb-2 leading-snug text-center">
        {card.headline}
      </h2>

      {/* Body — left aligned (not centered) */}
      {card.body.map((p, i) => (
        <p key={i} className="text-[13px] text-gray-600 mb-1.5 leading-relaxed text-left">{p}</p>
      ))}

      {/* Features */}
      <div className="flex flex-col gap-2 mt-3 mb-3">
        {card.features.map((f, i) => {
          // Only split off a leading emoji — never split plain words
          // (fixes "Sc hengen" / "Tr avel" style typography bugs).
          const m = f.match(/^(\p{Extended_Pictographic}(?:[\uFE0F\u200D]\p{Extended_Pictographic}?)*)\s*/u);
          const icon = m ? m[1] : '✓';
          const text = m ? f.slice(m[0].length) : f;
          return (
            <div key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
              <span className="text-base shrink-0">{icon}</span>
              <span>{text}</span>
            </div>
          );
        })}
      </div>

      {/* Price box removed — pricing shown only in option cards / checkout */}

      {/* Admin HTML notes */}
      {card.admin_html_notes && (
        <div
          className="mt-3 pt-3 text-[13px] text-gray-600"
          style={{ borderTop: '1px solid #e5e7eb' }}
          dangerouslySetInnerHTML={{ __html: card.admin_html_notes }}
        />
      )}
    </div>
  );
}

// ── ChatGPT-style passport country autocomplete + Continue ──
function rankCountryMatch(country: Country, q: string): number {
  const name = country.name.toLowerCase();
  const nameTr = (country.name_tr || '').toLowerCase();
  const iso = country.iso2.toLowerCase();
  if (name === q || nameTr === q || iso === q) return 0;
  if (name.startsWith(q) || nameTr.startsWith(q)) return 1;
  if (name.includes(q) || nameTr.includes(q)) return 2;
  return 99;
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
export default function EntryChat() {
  const { settings } = useSettings();
  const { lang, setLang, t, dir, options: LANG_OPTIONS } = useI18n();
  const site = getSiteCopy(lang);
  const copy = {
    continue: t('common.continue'),
    loadingCountries: t('chat.loadingCountries'),
    noCountry: t('chat.noCountry'),
    selectCountryFirst: t('chat.selectCountryFirst'),
    changeCountry: t('chat.changeCountry'),
    selectCountry: t('common.selectCountry'),
    passportCountry: t('chat.passportCountry'),
  };
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: '', i18nKey: 'site.welcome_message' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [composerHighlight, setComposerHighlight] = useState(0);
  const [composerMenuOpen, setComposerMenuOpen] = useState(false);
  const [insuranceFormOpen, setInsuranceFormOpen] = useState(false);
  const [entryApply, setEntryApply] = useState<{ card: OptionCard; index: number } | null>(null);
  const [esimFormOpen, setEsimFormOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const composerCountrySuggestions = (() => {
    if (unlocked || selectedId) return [] as Country[];
    const q = inputValue.trim().toLowerCase();
    if (!q) return [] as Country[];
    return countries
      .map((c) => ({ c, rank: rankCountryMatch(c, q) }))
      .filter((x) => x.rank < 99)
      .sort((a, b) => a.rank - b.rank || a.c.name.localeCompare(b.c.name))
      .slice(0, 8)
      .map((x) => x.c);
  })();

  useEffect(() => {
    setComposerHighlight(0);
  }, [inputValue, unlocked]);

  // ── History state (kept internally; header now uses language + country) ──
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<SessionEntry[]>(() => readSessionHistory());
  const sessionIdRef = useRef<string>(generateSessionId());
  const sessionLabelRef = useRef<string>(t('site.newConversation'));

  const selectedCountry = countries.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    fetch('/api/travel/countries')
      .then(r => r.json())
      .then(d => setCountries(d.countries ?? []))
      .catch(console.error)
      .finally(() => setCountriesLoading(false));
  }, []);

  // ── Deep link support: /?country=slug selects the country in-chat.
  // The URL is normalized back to "/" — chat state never lives in the path.
  const deepLinkHandled = useRef(false);
  useEffect(() => {
    if (deepLinkHandled.current || countries.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get('country') || '').trim().toLowerCase();
    if (window.location.search) {
      window.history.replaceState(null, '', '/');
    }
    if (!slug) { deepLinkHandled.current = true; return; }
    deepLinkHandled.current = true;
    const match = countries.find(c =>
      c.id.toLowerCase() === slug ||
      c.iso2.toLowerCase() === slug ||
      c.name.toLowerCase() === slug ||
      c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug,
    );
    if (match) void handleSelectCountry(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);


  // When a country result renders, anchor the scroll to the passport line
  // (start of the new result) instead of jumping to the very bottom.
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorIndexRef = useRef(-1);
  const pendingAnchorRef = useRef(false);
  /** Scroll service panel (Insurance / entry / eSIM) so its title is at the top */
  const servicePanelRef = useRef<HTMLDivElement>(null);
  const pendingServiceScrollRef = useRef(false);

  const scrollChatToEl = (el: HTMLElement | null) => {
    const chat = chatRef.current;
    if (!chat || !el) return;
    const chatRect = chat.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    chat.scrollTo({
      top: chat.scrollTop + (elRect.top - chatRect.top) - 8,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (pendingAnchorRef.current && anchorRef.current) {
      scrollChatToEl(anchorRef.current);
      return undefined; // keep passport line near top; do NOT force-scroll to bottom
    }
    if (pendingServiceScrollRef.current) {
      // Wait for Insurance / entry / eSIM panel to mount, then pin its title to the top
      const t = window.setTimeout(() => {
        if (servicePanelRef.current) {
          pendingServiceScrollRef.current = false;
          scrollChatToEl(servicePanelRef.current);
        }
      }, 50);
      return () => window.clearTimeout(t);
    }
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    return undefined;
  }, [messages, loading]);

  const addMsg = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);

  // ── Save current session to history ──
  const persistSession = useCallback((msgs: ChatMessage[], label?: string) => {
    const preview = lastBotText(msgs);
    if (!preview) return; // nothing meaningful yet
    const entry: SessionEntry = {
      id: sessionIdRef.current,
      label: label ?? sessionLabelRef.current,
      preview,
      updatedAt: new Date().toISOString(),
    };
    upsertSessionInHistory(entry);
    setSessions(readSessionHistory());
  }, []);

  // ── Start a brand-new chat ──
  const startNewChat = useCallback(() => {
    sessionIdRef.current = generateSessionId();
    sessionLabelRef.current = t('site.newConversation');
    setMessages([{ role: 'bot', text: '', i18nKey: 'site.welcome_message' }]);
    setSelectedId('');
    selectingRef.current = false;
    anchorIndexRef.current = -1;
    pendingAnchorRef.current = false;
    setUnlocked(false);
    setInputValue('');
    setShowHistory(false);
  }, [t]);

  // ── Select a past session (load its label as active, close panel) ──
  const handleSelectSession = useCallback((id: string) => {
    // Switch active session reference so future saves target this session
    sessionIdRef.current = id;
    const found = sessions.find((s) => s.id === id);
    if (found) sessionLabelRef.current = found.label;
    setShowHistory(false);
  }, [sessions]);

  // ── Delete a session from history ──
  const handleDeleteSession = useCallback((id: string) => {
    removeSessionFromHistory(id);
    setSessions(readSessionHistory());
  }, []);

  // ── Reorder sessions (drag drop) ──
  const handleReorder = useCallback((newOrder: SessionEntry[]) => {
    setSessions(newOrder);
    writeSessionHistory(newOrder);
  }, []);

  /** Send a chat message with SSE streaming. */
  const sendStreamingChat = async (
    countryId: string,
    message: string,
    history: ChatMessage[],
    onCard: (card: EntryCardData) => void,
    onToken: (token: string) => void,
  ): Promise<void> => {
    const res = await fetch('/api/travel/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify({ countryId, message, history, language: lang }),
    });

    if (!res.ok || !res.body) {
      onToken(t('chat.aiError'));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') return;
        if (payload.startsWith('[ERROR]')) {
          onToken(payload.slice(7).trim() || 'An error occurred.');
          return;
        }
        if (payload.startsWith('[CARD]')) {
          try { onCard(JSON.parse(payload.slice(6))); } catch { /* ignore */ }
          continue;
        }
        // Unescape newlines encoded by the server
        onToken(payload.replace(/\\n/g, '\n'));
      }
    }
  };

  const selectingRef = useRef(false);
  const handleSelectCountry = async (countryId: string) => {
    // Re-entrancy guard: ignore rapid double-taps before state re-renders
    if (selectingRef.current || selectedId || loading) return;
    const country = countries.find(c => c.id === countryId);
    if (!country) return;
    selectingRef.current = true;
    setSelectedId(countryId);

    // Label this session by the country
    sessionLabelRef.current = `${country.flag_emoji} ${country.name}`;

    // ALL categories stay in chat on "/" — no navigation on country select.
    // NO AI-generated intro bubble: the result is admin-managed content only
    // (top block → card → option cards → CTAs).
    // NO fake user bubble either — the user already selected the country;
    // only a short system confirmation, then the result immediately.
    // Anchor scrolling to the confirmation line (start of the new result)
    setMessages(prev => {
      anchorIndexRef.current = prev.length;
      return prev;
    });
    pendingAnchorRef.current = true;
    addMsg({
      role: 'system',
      text: '',
      i18nKey: 'site.passport_selected',
      i18nVars: { country: country.name },
    });
    setUnlocked(true);
    setLoading(true);

    try {
      const res = await fetch(`/api/travel/countries/${countryId}`);
      if (!res.ok) throw new Error('country fetch failed');
      const d = await res.json();
      const card = (d.card ?? null) as EntryCardData | null;
      const optionCards = ((d.option_cards ?? []) as OptionCard[]).filter(
        (oc) => oc && oc.active !== false,
      );
      // Country result: service hub first; entry options appear after entry service click
      addMsg({
        role: 'bot',
        text: '',
        card,
        optionCards: optionCards.length > 0 ? optionCards : undefined,
        showServices: true,
        activeService: null,
      });
    } catch {
      addMsg({ role: 'bot', text: '', i18nKey: 'site.countryLoadError' });
    } finally {
      setLoading(false);
      // Save to history after the first response
      setMessages(prev => {
        persistSession(prev, sessionLabelRef.current);
        return prev;
      });
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedId) return;
    setInputValue('');
    // Typed follow-ups resume normal scroll-to-bottom behavior
    pendingAnchorRef.current = false;

    // Snapshot history before adding new user message (for context)
    const historySnapshot = messages.filter(m => m.role === 'user' || m.role === 'bot');
    addMsg({ role: 'user', text });
    setLoading(true);

    const botIndex = { current: -1 };
    setMessages(prev => {
      botIndex.current = prev.length;
      return [...prev, { role: 'bot' as const, text: '' }];
    });

    try {
      await sendStreamingChat(
        selectedId,
        text,
        historySnapshot,
        () => { /* no card update on follow-up messages */ },
        (token) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[botIndex.current] = {
              ...updated[botIndex.current],
              text: updated[botIndex.current].text + token,
            };
            return updated;
          });
        },
      );
    } finally {
      setLoading(false);
      // Update session preview after each follow-up
      setMessages(prev => {
        persistSession(prev, sessionLabelRef.current);
        return prev;
      });
    }
  };

  return (
    <div
      className="flex items-center justify-center p-4"
      style={{ background: '#f4f6f9', minHeight: '100dvh' }}
    >
      <div
        className="w-full flex flex-col overflow-hidden relative"
        dir={dir}
        style={{
          maxWidth: 430,
          height: 'min(860px, calc(100dvh - 2rem))',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 24,
          boxShadow: '0 8px 28px rgba(10,31,68,.08)',
        }}
      >
        {/* ── History panel (overlays the whole card) ── */}
        {showHistory && (
          <HistoryPanel
            sessions={sessions}
            activeId={sessionIdRef.current}
            onReorder={handleReorder}
            onSelect={handleSelectSession}
            onDelete={handleDeleteSession}
            onClose={() => setShowHistory(false)}
            onNewChat={startNewChat}
          />
        )}

        {/* ── Header ── */}
        <header
          className="flex items-center gap-3 px-4 shrink-0"
          style={{ background: '#0a1f44', minHeight: 64 }}
        >
          <TurkeyFlagLogo size={36} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-white truncate">
              {settings.brand.site_name}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/85">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full" style={{ background: '#16a34a' }}>
                <span className="text-[8px] text-white leading-none">✓</span>
              </span>
              {site.status_line}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="sr-only" htmlFor="langSelect">{t('common.language')}</label>
            <select
              id="langSelect"
              value={lang}
              onChange={(e) => setLang(e.target.value as LangCode)}
              aria-label="Language"
              className="text-[12px] font-semibold rounded-full px-2.5 py-1.5 outline-none cursor-pointer"
              style={{
                background: 'rgba(255,255,255,.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.28)',
              }}
            >
              {LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code} style={{ color: '#0a1f44' }}>
                  {l.native} — {l.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Passport country bar — only after visitor has selected a country */}
        <AnimatePresence initial={false}>
          {selectedCountry && (
            <motion.div
              key="passport-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 overflow-hidden"
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}
              >
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
                  {copy.passportCountry}
                </div>
                <button
                  type="button"
                  onClick={() => startNewChat()}
                  className="flex-1 min-w-0 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left"
                  style={{ background: '#fff', border: '1px solid #e5e7eb' }}
                >
                  <span className="text-[13px] font-medium text-gray-900 truncate">
                    {selectedCountry.flag_emoji} {selectedCountry.name}
                  </span>
                  <span className="text-[11px] font-semibold shrink-0" style={{ color: BTN }}>
                    {copy.changeCountry}
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Chat thread ── */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto flex flex-col gap-3 p-4"
          style={{ background: '#f4f6f9' }}
        >
          <AnimatePresence mode="wait">
            {!selectedId && !loading ? (
              <motion.div
                key="welcome"
                className="flex-1 flex flex-col relative overflow-hidden min-h-[320px] rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${settings.brand.welcome_bg_url || '/istanbul-welcome-bg.jpg'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 35%',
                    filter: 'saturate(1.15) contrast(1.06)',
                  }}
                  aria-hidden
                />
                {/* Soft top/bottom scrims only — image stays open in the middle */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(8,22,48,.55) 0%, rgba(8,22,48,.12) 28%, rgba(8,22,48,.05) 48%, rgba(8,22,48,.35) 72%, rgba(8,22,48,.62) 100%)',
                  }}
                  aria-hidden
                />

                {/* Sky band — title */}
                <div className="relative z-[1] flex-1 flex flex-col items-center text-center px-5 pt-8 sm:pt-10">
                  {site.welcome_title && (
                    <h1
                      className="font-semibold text-[22px] sm:text-[26px] leading-tight tracking-tight text-white max-w-[320px]"
                      style={{ textShadow: '0 2px 18px rgba(0,0,0,.45)' }}
                    >
                      {site.welcome_title}
                    </h1>
                  )}
                </div>

                {/* Sea band — body + hint */}
                <div className="relative z-[1] flex flex-col items-center text-center px-5 pb-7 pt-2">
                  {site.welcome_message && (
                    <p
                      className="text-[13px] sm:text-[14px] text-white/95 leading-relaxed max-w-[340px]"
                      style={{ textShadow: '0 1px 12px rgba(0,0,0,.5)' }}
                    >
                      {site.welcome_message}
                    </p>
                  )}
                  {site.select_hint && (
                    <p
                      className="text-[12px] sm:text-[13px] font-medium text-white/90 mt-3 max-w-[280px]"
                      style={{ textShadow: '0 1px 10px rgba(0,0,0,.5)' }}
                    >
                      {site.select_hint}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col items-center" aria-hidden>
                    <span className="teg-pulse-arrow on-photo">↓</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="thread"
                className="flex flex-col gap-3"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {messages.map((msg, i) => {
                  const locCard = msg.card ? localizeEntryCard(msg.card, lang) : null;
                  const locOptions = localizeOptionCards(msg.optionCards, lang);
                  const displayText = msg.i18nKey
                    ? t(msg.i18nKey, msg.i18nVars)
                    : msg.text;
                  return (
                  <div key={i} ref={i === anchorIndexRef.current ? anchorRef : undefined}>
                    {msg.role === 'system' && (
                      <motion.div
                        className="text-center text-[12px] text-gray-400 my-1 font-medium"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                      >
                        {displayText}
                      </motion.div>
                    )}
                    {msg.role === 'bot' && displayText !== '' && !(!selectedId && !msg.card && i === 0) && (
                      <div className="flex items-start gap-2">
                        <div
                          className="shrink-0 flex items-center justify-center text-sm"
                          style={{ width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)' }}
                        >
                          🕌
                        </div>
                        <div
                          className="px-3.5 py-2.5 text-[14px] text-gray-800 leading-relaxed whitespace-pre-line"
                          style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', maxWidth: '85%' }}
                        >
                          {displayText}
                        </div>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="flex justify-end">
                        <div
                          className="px-3.5 py-2.5 text-[14px] text-white leading-relaxed"
                          style={{ background: '#0a1f44', maxWidth: '75%', borderRadius: '16px 4px 16px 16px' }}
                        >
                          {msg.text}
                        </div>
                      </div>
                    )}
                    {msg.showServices && (
                      <motion.div
                        className="mt-1"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.32, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {site.choose_service_label && (
                          <p className="text-[12px] font-semibold text-gray-500 mb-2 tracking-wide uppercase">
                            {site.choose_service_label}
                          </p>
                        )}
                        <ServiceHub
                          active={msg.activeService ?? null}
                          category={msg.card?.category}
                          labels={site.services}
                          onSelect={(id) => {
                            pendingAnchorRef.current = false;
                            // VISA FREE frame opens the insurance page (same product path)
                            const target: ServiceId =
                              id === 'entry' && msg.card?.category === WIRE_CAT.entryFree
                                ? 'insurance'
                                : id;
                            // Re-click active service → collapse back to hub only
                            if (msg.activeService === target || (id === 'entry' && msg.activeService === 'insurance' && msg.card?.category === WIRE_CAT.entryFree)) {
                              setInsuranceFormOpen(false);
                              setEntryApply(null);
                              setEsimFormOpen(false);
                              setMessages((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], activeService: null };
                                return next;
                              });
                              return;
                            }
                            setInsuranceFormOpen(false);
                            setEntryApply(null);
                            setEsimFormOpen(false);
                            pendingServiceScrollRef.current = true;
                            setMessages((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], activeService: target };
                              return next;
                            });
                          }}
                        />
                      </motion.div>
                    )}

                    {msg.card && msg.activeService === 'entry' && msg.card.category !== WIRE_CAT.entryFree && (
                      <motion.div
                        ref={servicePanelRef}
                        className="mt-3"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {!entryApply && (
                          <button
                            type="button"
                            onClick={() => {
                              pendingServiceScrollRef.current = false;
                              setEntryApply(null);
                              setMessages((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], activeService: null };
                                return next;
                              });
                            }}
                            className="mb-2 text-[12px] font-semibold text-gray-500 hover:text-gray-800"
                          >
                            {t('chat.backToServices')}
                          </button>
                        )}
                        {entryApply ? (
                          entryApply.index <= 2 ? (
                            <EntryApplyForm
                              option={localizeOptionCards([entryApply.card], lang)?.[0] || entryApply.card}
                              optionIndex={entryApply.index}
                              insuranceDailyPrice={settings.pricing.insurance.daily_price}
                              currency={entryApply.card.currency || settings.pricing.fees.currency || 'USD'}
                              onBack={() => setEntryApply(null)}
                            />
                          ) : (
                            <StickerApplyForm
                              option={localizeOptionCards([entryApply.card], lang)?.[0] || entryApply.card}
                              optionIndex={entryApply.index}
                              currency={entryApply.card.currency || settings.pricing.fees.currency || 'USD'}
                              countries={countries.map((c) => ({
                                id: c.id,
                                name: c.name,
                                flag_emoji: c.flag_emoji,
                              }))}
                              defaultCountry={selectedCountry?.name || ''}
                              onBack={() => setEntryApply(null)}
                            />
                          )
                        ) : (
                          <>
                            {locCard && (
                              <>
                            <CountryTopBlock card={locCard} content={{
                              ...settings.content,
                              country_card: site.country_card,
                              category_lines: site.category_lines,
                            }} />
                            <EntryCard card={locCard} content={{
                              ...settings.content,
                              country_card: site.country_card,
                              category_lines: site.category_lines,
                            }} />
                              </>
                            )}
                            {locOptions && locOptions.length > 0 && (
                              <div className="mt-2">
                                <OptionCards
                                  cards={locOptions}
                                  insuranceBadge={site.insurance_badge}
                                  onApply={(card, index) => {
                                    // Option 1–3: permit form · Option 4: sticker/support form
                                    if (index < 0 || index > 3) return;
                                    // Keep original API card for form (eligible_tags / ids);
                                    // display already used localized copy.
                                    const original = msg.optionCards?.[index] || card;
                                    setEntryApply({ card: original, index });
                                    pendingServiceScrollRef.current = true;
                                    window.setTimeout(() => {
                                      if (servicePanelRef.current) {
                                        pendingServiceScrollRef.current = false;
                                        scrollChatToEl(servicePanelRef.current);
                                      }
                                    }, 60);
                                  }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}

                    {msg.activeService === 'insurance' && (
                      <motion.div
                        ref={servicePanelRef}
                        className="mt-3"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {!insuranceFormOpen && (
                          <button
                            type="button"
                            onClick={() => {
                              setInsuranceFormOpen(false);
                              setMessages((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], activeService: null };
                                return next;
                              });
                            }}
                            className="mb-2 text-[12px] font-semibold text-gray-500 hover:text-gray-800"
                          >
                            {t('chat.backToServices')}
                          </button>
                        )}
                        <InsuranceInfo
                          dailyPrice={settings.pricing.insurance.daily_price}
                          minDays={settings.pricing.insurance.min_days || 1}
                          copy={site.insurance}
                          freeEntry={
                            locCard?.category === WIRE_CAT.entryFree
                              ? {
                                  headline: locCard.headline,
                                  body: locCard.body,
                                  features: locCard.features,
                                }
                              : null
                          }
                          onFormVisibilityChange={(open) => {
                            setInsuranceFormOpen(open);
                            if (open) {
                              pendingServiceScrollRef.current = true;
                              window.setTimeout(() => {
                                if (servicePanelRef.current) {
                                  pendingServiceScrollRef.current = false;
                                  scrollChatToEl(servicePanelRef.current);
                                }
                              }, 60);
                            }
                          }}
                        />
                      </motion.div>
                    )}

                    {msg.activeService === 'esim' && (
                      <motion.div
                        ref={servicePanelRef}
                        className="mt-3"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {!esimFormOpen && (
                          <button
                            type="button"
                            onClick={() => {
                              setEsimFormOpen(false);
                              setMessages((prev) => {
                                const next = [...prev];
                                next[i] = { ...next[i], activeService: null };
                                return next;
                              });
                            }}
                            className="mb-2 text-[12px] font-semibold text-gray-500 hover:text-gray-800"
                          >
                            {t('chat.backToServices')}
                          </button>
                        )}
                        <EsimPlans
                          esim={settings.esim}
                          page={site.esim_page}
                          countries={countries.map((c) => ({
                            id: c.id,
                            name: c.name,
                            flag_emoji: c.flag_emoji,
                          }))}
                          defaultCountry={selectedCountry?.name || ''}
                          onFormVisibilityChange={(open) => {
                            setEsimFormOpen(open);
                            if (open) {
                              pendingServiceScrollRef.current = true;
                              window.setTimeout(() => {
                                if (servicePanelRef.current) {
                                  pendingServiceScrollRef.current = false;
                                  scrollChatToEl(servicePanelRef.current);
                                }
                              }, 60);
                            }
                          }}
                        />
                      </motion.div>
                    )}
                  </div>
                  );
                })}

                {loading && (
                  <div className="flex items-start gap-2">
                    <div
                      className="shrink-0 flex items-center justify-center text-sm"
                      style={{ width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)' }}
                    >
                      🕌
                    </div>
                    <div
                      className="px-4 py-3.5 flex gap-1"
                      style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
                    >
                      {['-0.3s', '-0.15s', '0s'].map((d, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#9ca3af', animationDelay: d }} />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Composer ──
            Before country select: type country name here → autocomplete → go to country
            After country select: normal chat */}
        <div
          className="shrink-0 flex flex-col gap-2 px-3 pt-3 relative"
          style={{
            borderTop: '1px solid #e5e7eb',
            background: '#fff',
            paddingBottom: 'max(28px, calc(16px + env(safe-area-inset-bottom)))',
          }}
        >
          {!unlocked && composerMenuOpen && inputValue.trim() && (
            <div
              className="absolute left-3 right-3 bottom-full mb-1 rounded-xl overflow-hidden z-20"
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 -8px 24px rgba(10,31,68,.12)',
                maxHeight: 220,
                overflowY: 'auto',
              }}
              role="listbox"
            >
              {countriesLoading ? (
                <div className="px-3 py-3 text-[13px] text-gray-400">{copy.loadingCountries}</div>
              ) : composerCountrySuggestions.length === 0 ? (
                <div className="px-3 py-3 text-[13px] text-gray-400">{copy.noCountry}</div>
              ) : (
                composerCountrySuggestions.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={idx === composerHighlight}
                    onMouseEnter={() => setComposerHighlight(idx)}
                    onClick={() => {
                      setInputValue('');
                      setComposerMenuOpen(false);
                      void handleSelectCountry(c.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[14px] text-gray-800"
                    style={{ background: idx === composerHighlight ? '#eff6ff' : '#fff' }}
                  >
                    <span className="text-base">{c.flag_emoji}</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center gap-2 border border-gray-200 rounded-2xl px-3 py-1.5"
              style={{ background: '#f9fafb' }}
            >
              <input
                id="messageInput"
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (!unlocked) setComposerMenuOpen(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (!unlocked && inputValue.trim()) setComposerMenuOpen(true);
                }}
                onKeyDown={(e) => {
                  if (unlocked) {
                    if (e.key === 'Enter') handleSend();
                    return;
                  }
                  // Country search mode
                  if (e.key === 'ArrowDown' && composerCountrySuggestions.length) {
                    e.preventDefault();
                    setComposerHighlight((h) => (h + 1) % composerCountrySuggestions.length);
                  } else if (e.key === 'ArrowUp' && composerCountrySuggestions.length) {
                    e.preventDefault();
                    setComposerHighlight((h) => (h - 1 + composerCountrySuggestions.length) % composerCountrySuggestions.length);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const pick = composerCountrySuggestions[composerHighlight] || composerCountrySuggestions[0];
                    if (pick) {
                      setInputValue('');
                      setComposerMenuOpen(false);
                      void handleSelectCountry(pick.id);
                    }
                  } else if (e.key === 'Escape') {
                    setComposerMenuOpen(false);
                  }
                }}
                disabled={loading && !unlocked}
                placeholder={unlocked ? site.ask_placeholder : site.type_country_placeholder}
                aria-label={unlocked ? site.ask_placeholder : site.type_country_placeholder}
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-gray-800 placeholder:text-gray-400 placeholder:text-[13px]"
              />
            </div>
            <button
              onClick={() => {
                if (unlocked) {
                  handleSend();
                  return;
                }
                const pick = composerCountrySuggestions[composerHighlight] || composerCountrySuggestions[0];
                if (pick) {
                  setInputValue('');
                  setComposerMenuOpen(false);
                  void handleSelectCountry(pick.id);
                }
              }}
              disabled={
                loading ||
                (unlocked ? !inputValue.trim() : composerCountrySuggestions.length === 0)
              }
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0 disabled:opacity-40"
              style={{ background: BTN }}
              aria-label={unlocked ? 'Send' : copy.continue}
            >
              ➤
            </button>
          </div>

          <TrustFaq trust={settings.trust} />
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}

function lastBotText(messages: ChatMessage[]): string {
  const botMsgs = messages.filter(
    (m) => m.role === 'bot' && (m.text.trim() || m.i18nKey),
  );
  const last = botMsgs[botMsgs.length - 1];
  if (!last) return '';
  return (last.text.trim() || last.i18nKey || '').slice(0, 80);
}

function SessionRow({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: SessionEntry;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={session}
      dragListener={false}
      dragControls={controls}
      className="select-none"
      style={{ listStyle: 'none' }}
      whileDrag={{ scale: 1.02, boxShadow: '0 4px 16px rgba(10,31,68,.15)', zIndex: 50 }}
    >
      <div
        className="flex items-center gap-2 px-2 py-2 rounded-xl transition-colors"
        style={{
          background: isActive ? '#eff6ff' : '#f9fafb',
          border: `1px solid ${isActive ? '#bfdbfe' : '#e5e7eb'}`,
        }}
      >
        <DragHandle controls={controls} />

        {/* Content — clickable to load */}
        <button
          onClick={() => onSelect(session.id)}
          className="flex-1 min-w-0 text-left"
        >
          <div
            className="text-[13px] font-semibold truncate"
            style={{ color: isActive ? '#1d4ed8' : '#111827' }}
          >
            {session.label}
          </div>
          {session.preview && (
            <div className="text-[11px] text-gray-400 truncate mt-0.5">
              {session.preview}
            </div>
          )}
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.id);
          }}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors text-[14px]"
          aria-label="Delete conversation"
          title="Delete"
        >
          ×
        </button>
      </div>
    </Reorder.Item>
  );
}

function HistoryPanel({
  sessions,
  activeId,
  onReorder,
  onSelect,
  onDelete,
  onClose,
  onNewChat,
}: {
  sessions: SessionEntry[];
  activeId: string | null;
  onReorder: (sessions: SessionEntry[]) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onNewChat: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col rounded-[24px] overflow-hidden"
      style={{ background: '#fff' }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ borderBottom: '1px solid #e5e7eb', minHeight: 60 }}
      >
        <span className="font-semibold text-[15px] text-gray-900">Past Conversations</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-full text-white"
            style={{ background: BTN }}
          >
            + New
          </button>
          <button
            onClick={onClose}
            className="text-[20px] text-gray-400 hover:text-gray-700 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close history"
          >
            ×
          </button>
        </div>
      </div>

      {/* Draggable session list */}
      <div className="flex-1 overflow-y-auto p-3">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <span className="text-3xl">💬</span>
            <span className="text-[13px]">No past conversations yet.</span>
            <span className="text-[12px]">Start a chat to see it here.</span>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-gray-400 mb-2 px-1">
              Drag <span className="font-medium">≡</span> to reorder
            </p>
            <Reorder.Group
              axis="y"
              values={sessions}
              onReorder={onReorder}
              className="flex flex-col gap-2"
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isActive={session.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
            </Reorder.Group>
          </>
        )}
      </div>
    </div>
  );
}
