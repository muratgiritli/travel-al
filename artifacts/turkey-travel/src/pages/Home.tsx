import { useState, useRef, useEffect } from 'react';
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
  useGetChatMessages,
  useSendChatMessage,
  useListCountries,
} from '@workspace/api-client-react';

// ─── Mosque SVG icon ─────────────────────────────────────────────────────────

function MosqueIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left minaret */}
      <rect x="0.5" y="9.5" width="2.5" height="10.5" rx="0.4" />
      <polygon points="1.75,5.5 0.5,9.5 3,9.5" />
      <circle cx="1.75" cy="5.2" r="0.7" />
      {/* Right minaret */}
      <rect x="21" y="9.5" width="2.5" height="10.5" rx="0.4" />
      <polygon points="22.25,5.5 21,9.5 23.5,9.5" />
      <circle cx="22.25" cy="5.2" r="0.7" />
      {/* Dome */}
      <path d="M6 13.5 C6 8.8 9 6.5 12 6.5 C15 6.5 18 8.8 18 13.5 Z" />
      {/* Body */}
      <rect x="4" y="13.5" width="16" height="6.5" rx="0.4" />
      {/* Door arch */}
      <path d="M10.5 20 L10.5 17.2 Q12 15.4 13.5 17.2 L13.5 20 Z" fill="white" opacity="0.55" />
    </svg>
  );
}

// ─── Flag image helper ────────────────────────────────────────────────────────

/** Returns a reliable flag image URL from flagcdn.com */
const flagUrl = (code: string) =>
  `https://flagcdn.com/w20/${code.toLowerCase()}.png`;

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
  },
};

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'EN', label: 'English' },
  { code: 'ES', label: 'Español' },
  { code: 'AR', label: 'العربية' },
  { code: 'FR', label: 'Français' },
  { code: 'TR', label: 'Türkçe' },
];

// ─── Country data (static fallback) ──────────────────────────────────────────

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

// ─── Reusable flag image ──────────────────────────────────────────────────────

function FlagImg({ code, size = 20 }: { code: string; size?: number }) {
  return (
    <img
      src={flagUrl(code)}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-[2px] object-cover shrink-0"
      loading="lazy"
      onError={e => {
        // Hide broken images gracefully
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [lang, setLang] = useState<Lang>('EN');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = TRANSLATIONS[lang];

  // Queries & Mutations
  const { data: apiCountries } = useListCountries();
  const createSession = useCreateChatSession();
  const { data: apiMessages } = useGetChatMessages(sessionId || '', {
    query: { enabled: !!sessionId, queryKey: ['chatMessages', sessionId] },
  });
  const sendMessage = useSendChatMessage();

  // Normalise country list — only need code + name (flag from CDN)
  const countries: { code: string; name: string }[] =
    apiCountries?.length
      ? apiCountries.map(c => ({ code: c.code, name: c.name }))
      : STATIC_COUNTRIES;

  const popularCountries = POPULAR_CODES
    .map(code => countries.find(c => c.code === code))
    .filter(Boolean) as { code: string; name: string }[];

  const filteredCountries = countries.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [inputValue]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [apiMessages, isTyping, sessionId]);

  // Close lang menu on outside click OR Escape
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', clickHandler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', clickHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const handleSelectCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    createSession.mutate(
      { data: { passportCountryCode: countryCode } },
      { onSuccess: session => setSessionId(session.id) },
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !sessionId) return;
    const text = inputValue.trim();
    setInputValue('');
    setIsTyping(true);
    sendMessage.mutate(
      { sessionId, data: { text } },
      {
        onSuccess: () => setIsTyping(false),
        onError: () => setIsTyping(false),
      },
    );
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const isRtl = lang === 'AR';

  return (
    <div
      className="w-full flex flex-col items-center bg-[#F0F2F5]"
      style={{ height: '100dvh' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Centered panel ── */}
      <div
        className="w-full max-w-[720px] flex flex-col bg-white overflow-hidden"
        style={{ height: '100dvh' }}
      >
        {/* ── Header ── */}
        <header
          className="flex items-center justify-between px-3 py-2.5 bg-white border-b shrink-0 z-10"
          style={{ minHeight: 56 }}
        >
          {/* Left: back + logo + title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 md:hidden shrink-0"
              data-testid="btn-back"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Gold mosque logo */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <MosqueIcon className="w-[20px] h-[20px] text-amber-500" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-[14px] leading-tight text-gray-900 truncate">
                {t.title}
              </p>
              <p className="text-[11px] text-green-600 font-medium">{t.online}</p>
            </div>
          </div>

          {/* Right: language selector + menu */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Language selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(v => !v)}
                className="flex items-center gap-0.5 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[12px] font-semibold text-gray-700 transition-colors"
                data-testid="btn-lang-selector"
                aria-label="Select language"
                aria-expanded={langMenuOpen}
              >
                {lang}
                <ChevronDown
                  className={`w-3 h-3 text-gray-500 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {langMenuOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[120px]">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] font-medium hover:bg-gray-50 transition-colors ${
                        lang === l.code ? 'text-blue-700 bg-blue-50' : 'text-gray-700'
                      }`}
                      data-testid={`btn-lang-${l.code}`}
                    >
                      <span>{l.label}</span>
                      {lang === l.code && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              data-testid="btn-menu"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ── Scroll area ── */}
        <div className="flex-1 overflow-y-auto bg-[#F0F2F5] px-3 pt-4 pb-2 scroll-smooth">
          <div className="flex flex-col gap-3 max-w-full">

            {/* Welcome bubble */}
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 shrink-0 flex items-center justify-center shadow-sm">
                <MosqueIcon className="w-4 h-4 text-amber-500" />
              </div>
              <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-[14px] text-gray-800 max-w-[85%] leading-relaxed">
                {t.welcome}
              </div>
            </div>

            {/* ── Passport selector card (State 1) ── */}
            {!sessionId && (
              <div
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 ml-10 animate-in fade-in slide-in-from-bottom-3 duration-400"
                data-testid="passport-selector"
              >
                <h3 className="font-semibold text-[14px] text-gray-800 mb-2.5">
                  {t.myPassport}
                </h3>

                {/* Search input */}
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="search"
                    placeholder={t.searchCountry}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 pl-8 pr-3 text-[13px] outline-none transition-all placeholder:text-gray-400"
                    data-testid="input-search-country"
                  />
                </div>

                {/* Popular chips */}
                {!searchQuery && (
                  <div className="mb-2.5">
                    <p className="text-[11px] text-gray-400 font-medium mb-1.5 uppercase tracking-wide">
                      {t.popular}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularCountries.map(c => (
                        <button
                          key={c.code}
                          onClick={() => handleSelectCountry(c.code)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all active:scale-95 text-[12px] font-semibold ${
                            selectedCountry === c.code
                              ? 'border-[#1A2942] bg-[#1A2942] text-white'
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                          }`}
                          data-testid={`btn-popular-${c.code}`}
                        >
                          <FlagImg code={c.code} size={16} />
                          <span>{c.code}</span>
                          {selectedCountry === c.code && (
                            <Check className="w-3 h-3" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Country list — scrolls INSIDE card */}
                <div className="overflow-y-auto" style={{ maxHeight: 'calc(4 * 44px)' }}>
                  {filteredCountries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => handleSelectCountry(c.code)}
                      className={`w-full flex items-center justify-between px-2 py-2.5 rounded-xl transition-colors text-left ${
                        selectedCountry === c.code
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                      data-testid={`btn-country-${c.code}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FlagImg code={c.code} size={20} />
                        <span className="font-medium text-[14px] text-gray-800">{c.name}</span>
                      </div>
                      <span className="text-[12px] text-gray-400 font-medium">{c.code}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <p className="text-center py-4 text-[13px] text-gray-400">
                      {t.noCountries}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Conversation (State 2) ── */}
            {sessionId && (
              <>
                {selectedCountryData && (
                  <div className="flex items-end justify-end gap-2 animate-in fade-in slide-in-from-right-3 duration-300">
                    <div className="bg-[#1A2942] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm text-[14px] max-w-[75%] flex items-center gap-2">
                      <FlagImg code={selectedCountryData.code} size={18} />
                      <span>{selectedCountryData.code}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 shrink-0 flex items-center justify-center shadow-sm">
                    <MosqueIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-[14px] text-gray-800 max-w-[85%] leading-relaxed">
                    {t.howCanIHelp}
                  </div>
                </div>

                {apiMessages?.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'items-end justify-end' : 'items-start'} gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 shrink-0 flex items-center justify-center shadow-sm">
                        <MosqueIcon className="w-4 h-4 text-amber-500" />
                      </div>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl shadow-sm text-[14px] max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[#1A2942] text-white rounded-tr-sm'
                          : 'bg-white text-gray-800 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-start gap-2 animate-in fade-in duration-200">
                    <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 shrink-0 flex items-center justify-center shadow-sm">
                      <MosqueIcon className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="bg-white px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
              </>
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
              disabled={!sessionId}
              data-testid="btn-attach"
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
                  handleSendMessage();
                }
              }}
              placeholder={sessionId ? t.unlockedPlaceholder : t.lockedPlaceholder}
              disabled={!sessionId}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 disabled:opacity-50"
              style={{ maxHeight: 120, overflowY: 'auto' }}
              data-testid="input-message"
            />

            {sessionId && !inputValue.trim() ? (
              <button
                className="p-2 text-gray-400 hover:text-gray-600 shrink-0 rounded-full transition-colors"
                data-testid="btn-mic"
                aria-label="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!sessionId || !inputValue.trim() || isTyping}
                className="w-9 h-9 rounded-full bg-[#1A2942] flex items-center justify-center text-white shrink-0 disabled:opacity-30 disabled:bg-gray-300 disabled:text-gray-500 transition-all mb-0.5"
                data-testid="btn-send"
                aria-label="Send"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            )}
          </div>

          {/* Trust footer — single line */}
          <p className="text-center text-[11px] text-gray-400 mt-1.5 leading-none">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
