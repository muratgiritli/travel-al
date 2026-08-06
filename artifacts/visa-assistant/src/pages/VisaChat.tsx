import { useState, useEffect, useRef, useCallback } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import OptionCards from '@/components/OptionCards';
import type { OptionCard } from '@/lib/settings';
import {
  readSessionHistory,
  writeSessionHistory,
  upsertSessionInHistory,
  removeSessionFromHistory,
  SessionEntry,
} from '@/lib/sessionHistory';
import { useSettings } from '@/lib/settings';

type CountryCategory = 'visa_exempt' | 'evisa_direct' | 'evisa_conditional' | 'age_special' | 'sticker_mission';

interface Country {
  id: string; name: string; iso2: string; flag_emoji: string;
  visa_summary: string; category: CountryCategory;
}

interface VisaCardData {
  country: string; iso2: string; flag_emoji: string;
  category: CountryCategory;
  visa_status: string; insurance_required: boolean;
  headline: string; body: string[];
  features: string[]; price_label: string; price_example: string;
  cta: string; cta_href: string;
  admin_html_notes: string;
}

interface ChatMessage {
  role: 'bot' | 'user' | 'system';
  text: string;
  card?: VisaCardData | null;
  optionCards?: OptionCard[];
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
function VisaCard({ card }: { card: VisaCardData }) {
  const isEvisa = card.category === 'evisa_direct';
  const ctaHref = card.cta_href;

  return (
    <div
      className="rounded-2xl p-4 shadow-sm mt-2 ml-10"
      style={{ background: '#fff', border: '1px solid #e5e7eb' }}
    >
      {/* Flags */}
      <div className="flex items-center gap-2 text-[14px] font-medium text-gray-800 mb-3">
        <span>{card.flag_emoji} {card.country}</span>
        <span className="text-gray-400">→</span>
        <span>🇹🇷 Türkiye</span>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {isEvisa ? (
          <span
            className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
          >
            {card.visa_status || 'e-Permit required'}
          </span>
        ) : (
          <span
            className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
          >
            {card.visa_status || 'Permit-free entry'}
          </span>
        )}
        {card.insurance_required && (
          <span
            className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
            style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
          >
            Insurance required
          </span>
        )}
      </div>

      {/* Headline */}
      <h2 className="font-semibold text-[15px] text-gray-900 mb-2 leading-snug">
        {card.headline}
      </h2>

      {/* Body */}
      {card.body.map((p, i) => (
        <p key={i} className="text-[13px] text-gray-600 mb-1.5 leading-relaxed">{p}</p>
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

      {/* Price box */}
      {card.price_label && (
        <div
          className="rounded-xl px-4 py-3 mb-3"
          style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
        >
          <div className="font-semibold text-[14px] text-gray-900">{card.price_label}</div>
          {card.price_example && (
            <div className="text-[12px] text-gray-500 mt-0.5">{card.price_example}</div>
          )}
        </div>
      )}

      {/* CTA */}
      <a
        href={ctaHref}
        className="block w-full text-center py-3 rounded-xl font-semibold text-[14px] text-white transition-colors mb-1"
        style={{ background: isEvisa ? '#1d4ed8' : '#0a1f44' }}
      >
        {card.cta}
      </a>

      {isEvisa && (
        <p className="text-center text-[11px] text-gray-400 mt-1">
          Internal application portal — no redirect to external sites
        </p>
      )}
      {!isEvisa && (
        <p className="text-center text-[11px] text-gray-400 mt-1">
          Instant PDF • Border-ready • Cancel anytime
        </p>
      )}

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

// ── In-chat passport picker card ──
const POPULAR_NAMES = ['Germany', 'United Kingdom', 'United States', 'Pakistan', 'Egypt', 'Vietnam'];

function PassportPickerCard({
  countries,
  onSelect,
  disabled,
  loading,
}: {
  countries: Country[];
  onSelect: (id: string) => void;
  disabled: boolean;
  loading: boolean;
}) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = q ? countries.filter(c => c.name.toLowerCase().includes(q)) : countries;
  const popular = countries.filter(c => POPULAR_NAMES.includes(c.name)).slice(0, 6);

  return (
    <div
      className="mt-2 ml-10 rounded-2xl overflow-hidden"
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,.06)',
        maxWidth: '88%',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <div className="px-4 pt-3 pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
        <span className="text-base">🛂</span>
        <span className="font-bold text-[14px] text-gray-900">My passport</span>
      </div>

      {/* Search */}
      <div className="px-3 pt-2.5">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search country…"
          aria-label="Search passport country"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] text-gray-800 bg-gray-50 outline-none"
        />
      </div>

      {/* Popular */}
      {!q && popular.length > 0 && (
        <div className="px-3 pt-2.5">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Popular</div>
          <div className="flex flex-wrap gap-1.5">
            {popular.map(c => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-medium text-gray-700 border border-gray-200 bg-gray-50 hover:bg-gray-100"
              >
                <span>{c.flag_emoji}</span> {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="px-2 py-2.5">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1 px-2">
          {q ? `Results (${filtered.length})` : 'All countries'}
        </div>
        <div className="overflow-y-auto flex flex-col" style={{ maxHeight: 200 }}>
          {loading ? (
            /* Skeleton rows while countries load — never a false empty state */
            <>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 animate-pulse" />
                  <div
                    className="h-3 rounded bg-gray-100 animate-pulse"
                    style={{ width: `${55 + (i % 3) * 15}%` }}
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-left text-[13px] text-gray-800 hover:bg-gray-50"
                >
                  <span className="text-base">{c.flag_emoji}</span>
                  <span className="flex-1 min-w-0 truncate">{c.name}</span>
                  <span className="text-gray-300 text-xs">›</span>
                </button>
              ))}
              {/* Only show when an active search has zero matches */}
              {q !== '' && filtered.length === 0 && (
                <div className="px-2 py-3 text-[13px] text-gray-400">No country found.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
export default function VisaChat() {
  const { settings } = useSettings();
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: settings.chat.welcome_message },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // ── History state ──
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<SessionEntry[]>(() => readSessionHistory());
  const sessionIdRef = useRef<string>(generateSessionId());
  const sessionLabelRef = useRef<string>('New conversation');

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

  // Sync the opening bot message with admin-configured welcome text once
  // settings load — only while the thread is still the fresh single greeting.
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'bot' && !prev[0].card) {
        return [{ role: 'bot', text: settings.chat.welcome_message }];
      }
      return prev;
    });
  }, [settings.chat.welcome_message]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
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
    sessionLabelRef.current = 'New conversation';
    setMessages([{ role: 'bot', text: settings.chat.welcome_message }]);
    setSelectedId('');
    selectingRef.current = false;
    setUnlocked(false);
    setInputValue('');
    setShowHistory(false);
  }, [settings.chat.welcome_message]);

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
    onCard: (card: VisaCardData) => void,
    onToken: (token: string) => void,
  ): Promise<void> => {
    const res = await fetch('/api/travel/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify({ countryId, message, history }),
    });

    if (!res.ok || !res.body) {
      onToken('Sorry, the AI service is unavailable right now. Please try again.');
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

    // ALL categories stay in chat on "/" — no navigation on country select.
    const hasOptionCards =
      country.category === 'evisa_conditional' ||
      country.category === 'age_special' ||
      country.category === 'sticker_mission';

    // Fetch admin-configured option cards in parallel with the chat stream.
    const optionCardsPromise: Promise<OptionCard[]> = hasOptionCards
      ? fetch(`/api/travel/countries/${countryId}`)
          .then(r => (r.ok ? r.json() : Promise.reject()))
          .then(d => (d.option_cards ?? []) as OptionCard[])
          .catch(() => [])
      : Promise.resolve([]);

    // Label this session by the country
    sessionLabelRef.current = `${country.flag_emoji} ${country.name}`;

    const userMsg = `I have a ${country.name} passport. What do I need to enter Turkey?`;
    addMsg({ role: 'user', text: `I have a ${country.name} passport.` });
    addMsg({ role: 'system', text: `Passport selected: ${country.name}` });
    addMsg({ role: 'user', text: 'What do I need to enter Turkey?' });
    setUnlocked(true);
    setLoading(true);

    // Placeholder bot message for streaming
    const botIndex = { current: -1 };
    setMessages(prev => {
      botIndex.current = prev.length;
      return [...prev, { role: 'bot' as const, text: '' }];
    });

    let card: VisaCardData | null = null;
    try {
      await sendStreamingChat(
        countryId,
        userMsg,
        [],
        (c) => {
          card = c;
          setMessages(prev => {
            const updated = [...prev];
            updated[botIndex.current] = { ...updated[botIndex.current], card: c };
            return updated;
          });
        },
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
      void card;
      // Attach in-chat option cards (conditional / age-special / sticker countries)
      const optionCards = await optionCardsPromise;
      if (optionCards.length > 0) {
        setMessages(prev => {
          const updated = [...prev];
          const idx = botIndex.current;
          if (idx >= 0 && idx < updated.length) {
            updated[idx] = { ...updated[idx], optionCards };
          }
          return updated;
        });
      }
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
          style={{ borderBottom: '1px solid #e5e7eb', minHeight: 60 }}
        >
          <div
            className="shrink-0 flex items-center justify-center text-xl"
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)',
            }}
          >
            {settings.brand.logo_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-gray-900">{settings.brand.site_name}</div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#16a34a' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
              Online
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* History toggle */}
            <button
              onClick={() => setShowHistory(v => !v)}
              className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Show conversation history"
              title="History"
            >
              {/* Clock icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {sessions.length > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: '#0a1f44' }}
                >
                  {sessions.length > 9 ? '9+' : sessions.length}
                </span>
              )}
            </button>
            <select className="text-[12px] font-semibold border border-gray-200 rounded-full px-2.5 py-1 bg-gray-50 text-gray-700" aria-label="Language">
              <option>EN</option>
            </select>
          </div>
        </header>

        {/* ── Chat thread ── */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto flex flex-col gap-3 p-4"
          style={{ background: '#f4f6f9' }}
        >
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'system' && (
                <div className="text-center text-[12px] text-gray-400 my-1 font-medium">{msg.text}</div>
              )}
              {msg.role === 'bot' && (
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
                    {msg.text}
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
              {msg.card && <VisaCard card={msg.card} />}
              {msg.optionCards && msg.optionCards.length > 0 && (
                <div className="mt-2 ml-10">
                  <OptionCards cards={msg.optionCards} />
                </div>
              )}
              {/* In-chat passport picker: shown under the opening bot question,
                  collapsed permanently once a passport is selected */}
              {i === 0 && msg.role === 'bot' && !selectedId && (
                <PassportPickerCard
                  key={sessionIdRef.current}
                  countries={countries}
                  onSelect={handleSelectCountry}
                  disabled={!!selectedId || loading}
                  loading={countriesLoading}
                />
              )}
            </div>
          ))}

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
        </div>

        {/* ── Composer ── */}
        <div
          className="shrink-0 flex flex-col gap-2 px-3 pt-3"
          style={{
            borderTop: '1px solid #e5e7eb',
            background: '#fff',
            paddingBottom: 'max(28px, calc(16px + env(safe-area-inset-bottom)))',
          }}
        >
          {/* Message input only — country is selected via the in-chat card */}
          <div className="flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 border border-gray-200 rounded-2xl px-3 py-1.5"
                style={{ background: '#f9fafb', opacity: unlocked ? 1 : 0.6 }}
              >
                <input
                  id="messageInput"
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={!unlocked}
                  placeholder={unlocked ? 'Ask about insurance, stay length, documents…' : 'Select your passport country above first…'}
                  className="flex-1 bg-transparent outline-none text-[14px] text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!unlocked || !inputValue.trim() || loading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0 disabled:opacity-40"
                style={{ background: '#0a1f44' }}
                aria-label="Send"
              >
                ➤
              </button>
            </div>

          <div className="text-center text-[11px] text-gray-400">
            {settings.chat.bottom_disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}

function lastBotText(messages: ChatMessage[]): string {
  const botMsgs = messages.filter((m) => m.role === 'bot' && m.text.trim());
  return botMsgs[botMsgs.length - 1]?.text.slice(0, 80) ?? '';
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
            style={{ background: '#0a1f44' }}
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
