import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  MoreVertical,
  Search,
  Paperclip,
  Mic,
  Send,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  useCreateChatSession,
  useSendChatMessage,
  useListCountries,
} from '@workspace/api-client-react';

// ─── Mosque SVG icon ──────────────────────────────────────────────────────────

function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="9.5" width="2.5" height="10.5" rx="0.4" />
      <polygon points="1.75,5.5 0.5,9.5 3,9.5" />
      <circle cx="1.75" cy="5.2" r="0.7" />
      <rect x="21" y="9.5" width="2.5" height="10.5" rx="0.4" />
      <polygon points="22.25,5.5 21,9.5 23.5,9.5" />
      <circle cx="22.25" cy="5.2" r="0.7" />
      <path d="M6 13.5 C6 8.8 9 6.5 12 6.5 C15 6.5 18 8.8 18 13.5 Z" />
      <rect x="4" y="13.5" width="16" height="6.5" rx="0.4" />
      <path d="M10.5 20 L10.5 17.2 Q12 15.4 13.5 17.2 L13.5 20 Z" fill="white" opacity="0.55" />
    </svg>
  );
}

// ─── Flag image helper ────────────────────────────────────────────────────────

const flagUrl = (code: string) => `https://flagcdn.com/w20/${code.toLowerCase()}.png`;

function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
  return (
    <img
      src={flagUrl(code)}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-[2px] object-cover shrink-0"
      loading="lazy"
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

// ─── Translations ─────────────────────────────────────────────────────────────

type Lang = 'EN' | 'ES' | 'AR' | 'FR' | 'TR';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  EN: {
    title: 'Turkey Travel Assistant',
    online: 'Online',
    welcome: 'Which country issued your passport?',
    myPassport: 'My passport',
    searchCountry: 'Search country',
    popular: 'Popular',
    lockedPlaceholder: 'Select your country…',
    unlockedPlaceholder: 'Message Turkey Travel Assistant...',
    howCanIHelp: 'How can I help you?',
    footer: 'AI guidance · Human travel experts available.',
    noCountries: 'No countries found.',
    passportSelected: 'Passport selected',
  },
  ES: {
    title: 'Asistente de Viaje Turquía',
    online: 'En línea',
    welcome: '¿Qué país emitió tu pasaporte?',
    myPassport: 'Mi pasaporte',
    searchCountry: 'Buscar país',
    popular: 'Popular',
    lockedPlaceholder: 'Selecciona tu país…',
    unlockedPlaceholder: 'Escribe un mensaje...',
    howCanIHelp: '¿En qué puedo ayudarte?',
    footer: 'Orientación IA · Expertos disponibles.',
    noCountries: 'No se encontraron países.',
    passportSelected: 'Pasaporte seleccionado',
  },
  AR: {
    title: 'مساعد السفر إلى تركيا',
    online: 'متصل',
    welcome: 'ما هي الدولة التي أصدرت جواز سفرك؟',
    myPassport: 'جواز سفري',
    searchCountry: 'ابحث عن دولة',
    popular: 'الأكثر شيوعاً',
    lockedPlaceholder: 'اختر بلدك…',
    unlockedPlaceholder: 'أرسل رسالة...',
    howCanIHelp: 'كيف يمكنني مساعدتك؟',
    footer: 'إرشادات ذكاء اصطناعي · خبراء سفر متاحون.',
    noCountries: 'لا توجد دول.',
    passportSelected: 'تم اختيار جواز السفر',
  },
  FR: {
    title: 'Assistant Voyage Turquie',
    online: 'En ligne',
    welcome: 'Quel pays a délivré votre passeport ?',
    myPassport: 'Mon passeport',
    searchCountry: 'Rechercher un pays',
    popular: 'Populaire',
    lockedPlaceholder: 'Sélectionnez votre pays…',
    unlockedPlaceholder: "Message à l'assistant...",
    howCanIHelp: 'Comment puis-je vous aider ?',
    footer: 'Conseils IA · Experts voyage disponibles.',
    noCountries: 'Aucun pays trouvé.',
    passportSelected: 'Passeport sélectionné',
  },
  TR: {
    title: 'Türkiye Seyahat Asistanı',
    online: 'Çevrimiçi',
    welcome: 'Pasaportunuzu hangi ülke verdi?',
    myPassport: 'Pasaportum',
    searchCountry: 'Ülke ara',
    popular: 'Popüler',
    lockedPlaceholder: 'Ülkenizi seçin…',
    unlockedPlaceholder: 'Mesaj yazın...',
    howCanIHelp: 'Size nasıl yardımcı olabilirim?',
    footer: 'Yapay zeka rehberliği · Uzmanlar mevcut.',
    noCountries: 'Ülke bulunamadı.',
    passportSelected: 'Pasaport seçildi',
  },
};

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'EN', label: 'English' },
  { code: 'ES', label: 'Español' },
  { code: 'AR', label: 'العربية' },
  { code: 'FR', label: 'Français' },
  { code: 'TR', label: 'Türkçe' },
];

// ─── Country data ─────────────────────────────────────────────────────────────

const STATIC_COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'CN', name: 'China' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'RU', name: 'Russia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'OM', name: 'Oman' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'YE', name: 'Yemen' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'CL', name: 'Chile' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'GE', name: 'Georgia' },
  { code: 'AM', name: 'Armenia' },
  { code: 'UA', name: 'Ukraine' },
];

const POPULAR_CODES = ['SA', 'EG', 'AE', 'CN', 'PK', 'IN', 'PH'];

// ─── Message types ────────────────────────────────────────────────────────────
// The single messages array is the source of truth for display.
// All content — bot responses, user bubbles, and the picker widget — lives here.

interface BotMessage {
  kind: 'bot';
  id: string;
  text: string;
  /** If set, look up in t[i18nKey] at render time so language switching works */
  i18nKey?: string;
}

interface UserMessage {
  kind: 'user';
  id: string;
  text: string;
  /** When present, render as a flag + code bubble instead of plain text */
  countryCode?: string;
}

interface WidgetMessage {
  kind: 'widget';
  id: string;
  widgetType: 'country-picker';
  /** active = picker is shown and interactive; completed = collapsed badge */
  status: 'active' | 'completed';
  selectedCode?: string;
}

type ChatMessage = BotMessage | UserMessage | WidgetMessage;

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}`;

// ─── Country Picker Widget ────────────────────────────────────────────────────

interface PickerProps {
  countries: { code: string; name: string }[];
  onSelect: (code: string) => void;
  t: Record<string, string>;
}

function CountryPickerWidget({ countries, onSelect, t }: PickerProps) {
  const [search, setSearch] = useState('');

  const popular = POPULAR_CODES
    .map(code => countries.find(c => c.code === code))
    .filter(Boolean) as { code: string; name: string }[];

  const filtered = countries.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 ml-10 animate-in fade-in slide-in-from-bottom-2 duration-300"
      data-testid="passport-selector"
    >
      <h3 className="font-semibold text-[14px] text-gray-800 mb-2.5">{t.myPassport}</h3>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          placeholder={t.searchCountry}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 pl-8 pr-3 text-[13px] outline-none transition-all placeholder:text-gray-400"
          data-testid="input-search-country"
        />
      </div>

      {/* Popular chips */}
      {!search && (
        <div className="mb-2.5">
          <p className="text-[11px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">{t.popular}</p>
          <div className="flex flex-wrap gap-1.5">
            {popular.map(c => (
              <button
                key={c.code}
                onClick={() => onSelect(c.code)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 transition-all text-[12px] font-semibold text-gray-700"
                data-testid={`btn-popular-${c.code}`}
              >
                <FlagImg code={c.code} size={16} />
                <span>{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Country list — scrolls inside the card */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(4 * 44px)' }}>
        {filtered.map(c => (
          <button
            key={c.code}
            onClick={() => onSelect(c.code)}
            className="w-full flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            data-testid={`btn-country-${c.code}`}
          >
            <div className="flex items-center gap-2.5">
              <FlagImg code={c.code} size={20} />
              <span className="font-medium text-[14px] text-gray-800">{c.name}</span>
            </div>
            <span className="text-[12px] text-gray-400 font-medium">{c.code}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-4 text-[13px] text-gray-400">{t.noCountries}</p>
        )}
      </div>
    </div>
  );
}

// ─── Completed picker badge ───────────────────────────────────────────────────

function CompletedPickerBadge({ code, t }: { code: string; t: Record<string, string> }) {
  return (
    <div className="ml-10 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl w-fit animate-in fade-in duration-300">
      <FlagImg code={code} size={16} />
      <span className="text-[12px] font-medium text-gray-500">{t.passportSelected}</span>
      <Check className="w-3.5 h-3.5 text-green-500" />
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 shrink-0 flex items-center justify-center shadow-sm">
      <MosqueIcon className="w-4 h-4 text-amber-500" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [lang, setLang] = useState<Lang>('EN');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Single messages array — the ONLY source of truth for what's rendered
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { kind: 'bot', id: nextId(), text: '', i18nKey: 'welcome' },
    { kind: 'widget', id: nextId(), widgetType: 'country-picker', status: 'active' },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  // API hooks
  const { data: apiCountries } = useListCountries();
  const createSession = useCreateChatSession();
  const sendMessage = useSendChatMessage();

  const countries: { code: string; name: string }[] =
    apiCountries?.length
      ? apiCountries.map(c => ({ code: c.code, name: c.name }))
      : STATIC_COUNTRIES;

  // Helpers
  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateWidget = useCallback((id: string, patch: Partial<WidgetMessage>) => {
    setMessages(prev =>
      prev.map(m => (m.id === id && m.kind === 'widget' ? { ...m, ...patch } : m)),
    );
  }, []);

  // Auto-scroll to bottom whenever messages or typing indicator change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [inputValue]);

  // Lang menu: close on outside click or Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // ── Country selection handler ────────────────────────────────────────────────
  // Finds the widget in the messages array, marks it completed, appends user
  // bubble, creates session, then appends "How can I help you?" — all in-thread.

  const handleSelectCountry = useCallback(
    (countryCode: string) => {
      // 1. Find the active widget message id
      const widgetMsg = messages.find(
        m => m.kind === 'widget' && (m as WidgetMessage).status === 'active',
      ) as WidgetMessage | undefined;
      if (!widgetMsg) return;

      // 2. Collapse the picker in-place (stays in history, now shows badge)
      updateWidget(widgetMsg.id, { status: 'completed', selectedCode: countryCode });

      // 3. Append user bubble with flag + code
      appendMessage({
        kind: 'user',
        id: nextId(),
        text: countryCode,
        countryCode,
      });

      // 4. Create API session; on success append the "How can I help?" bot message
      createSession.mutate(
        { data: { passportCountryCode: countryCode } },
        {
          onSuccess: session => {
            setSessionId(session.id);
            appendMessage({
              kind: 'bot',
              id: nextId(),
              text: '',
              i18nKey: 'howCanIHelp',
            });
            setIsUnlocked(true);
          },
        },
      );
    },
    [messages, appendMessage, updateWidget, createSession],
  );

  // ── Send message handler ─────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || !sessionId) return;
    setInputValue('');

    // Optimistically append user message
    appendMessage({ kind: 'user', id: nextId(), text });

    // Call API
    setIsTyping(true);
    sendMessage.mutate(
      { sessionId, data: { text } },
      {
        onSuccess: response => {
          setIsTyping(false);
          // The API returns the updated message list; get the last assistant message
          const assistantText =
            Array.isArray(response)
              ? response.filter((m: { role: string }) => m.role === 'assistant').at(-1)?.text ?? ''
              : (response as { text?: string })?.text ?? '';
          if (assistantText) {
            appendMessage({ kind: 'bot', id: nextId(), text: assistantText });
          }
        },
        onError: () => {
          setIsTyping(false);
        },
      },
    );
  }, [inputValue, sessionId, appendMessage, sendMessage]);

  const isRtl = lang === 'AR';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="w-full flex flex-col items-center bg-[#F0F2F5]"
      style={{ height: '100dvh' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-[720px] flex flex-col bg-white overflow-hidden" style={{ height: '100dvh' }}>

        {/* ── Header ── */}
        <header className="flex items-center justify-between px-3 py-2.5 bg-white border-b shrink-0 z-10" style={{ minHeight: 56 }}>
          <div className="flex items-center gap-2 min-w-0">
            <button className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 md:hidden shrink-0" aria-label="Back">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <MosqueIcon className="w-[20px] h-[20px] text-amber-500" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[14px] leading-tight text-gray-900 truncate">{t.title}</p>
              <p className="text-[11px] text-green-600 font-medium">{t.online}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(v => !v)}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[12px] font-semibold text-gray-700 transition-colors"
                aria-expanded={langMenuOpen}
                data-testid="btn-lang-selector"
              >
                {lang}
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {langMenuOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[120px]">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium hover:bg-gray-50 transition-colors ${lang === l.code ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}`}
                      data-testid={`btn-lang-${l.code}`}
                    >
                      <span>{l.label}</span>
                      {lang === l.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500" aria-label="Menu">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── Unified chat thread ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-[#F0F2F5] px-3 pt-4 pb-2 scroll-smooth"
        >
          <div className="flex flex-col gap-3 max-w-full">

            {messages.map(msg => {
              // ── Bot message ──────────────────────────────────────────────
              if (msg.kind === 'bot') {
                const text = msg.i18nKey ? (t[msg.i18nKey] ?? msg.text) : msg.text;
                return (
                  <div key={msg.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <BotAvatar />
                    <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-[14px] text-gray-800 max-w-[85%] leading-relaxed">
                      {text}
                    </div>
                  </div>
                );
              }

              // ── User message ─────────────────────────────────────────────
              if (msg.kind === 'user') {
                return (
                  <div key={msg.id} className="flex items-end justify-end gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="bg-[#1A2942] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm text-[14px] max-w-[75%] flex items-center gap-2">
                      {msg.countryCode ? (
                        <>
                          <FlagImg code={msg.countryCode} size={18} />
                          <span>{msg.countryCode}</span>
                        </>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.text}</span>
                      )}
                    </div>
                  </div>
                );
              }

              // ── Widget: country picker ────────────────────────────────────
              if (msg.kind === 'widget' && msg.widgetType === 'country-picker') {
                if (msg.status === 'active') {
                  return (
                    <CountryPickerWidget
                      key={msg.id}
                      countries={countries}
                      onSelect={handleSelectCountry}
                      t={t}
                    />
                  );
                }
                // completed: show collapsed badge in history
                return (
                  <CompletedPickerBadge
                    key={msg.id}
                    code={msg.selectedCode ?? ''}
                    t={t}
                  />
                );
              }

              return null;
            })}

            {/* Typing indicator — always at the bottom, never stored in messages */}
            {isTyping && (
              <div className="flex items-start gap-2 animate-in fade-in duration-200">
                <BotAvatar />
                <div className="bg-white px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        {/* ── Composer ── */}
        <div
          className="bg-white shrink-0 border-t border-gray-100"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            paddingTop: 8,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl px-1.5 py-1 focus-within:bg-white focus-within:border-blue-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 shrink-0 rounded-full transition-colors"
              disabled={!isUnlocked}
              aria-label="Attach"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isUnlocked ? t.unlockedPlaceholder : t.lockedPlaceholder}
              disabled={!isUnlocked}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
              style={{ maxHeight: 120, overflowY: 'auto' }}
              data-testid="input-message"
            />

            {isUnlocked && !inputValue.trim() ? (
              <button className="p-2 text-gray-400 hover:text-gray-600 shrink-0 rounded-full transition-colors" aria-label="Voice input">
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!isUnlocked || !inputValue.trim() || isTyping}
                className="w-9 h-9 rounded-full bg-[#1A2942] flex items-center justify-center text-white shrink-0 disabled:opacity-30 disabled:bg-gray-300 disabled:text-gray-500 transition-all mb-0.5"
                data-testid="btn-send"
                aria-label="Send"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            )}
          </div>

          <p className="text-center text-[11px] text-gray-400 mt-1.5 leading-none">
            {t.footer}
          </p>
        </div>

      </div>
    </div>
  );
}
