import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  MoreVertical,
  Search,
  Paperclip,
  Mic,
  Send,
  ChevronDown,
  Building2,
} from 'lucide-react';
import {
  useCreateChatSession,
  useGetChatMessages,
  useSendChatMessage,
  useListCountries,
} from '@workspace/api-client-react';

// ─── Translations ────────────────────────────────────────────────────────────

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
    unlockedPlaceholder: 'Message à l\'assistant...',
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
  { code: 'EN', label: 'EN' },
  { code: 'ES', label: 'ES' },
  { code: 'AR', label: 'AR' },
  { code: 'FR', label: 'FR' },
  { code: 'TR', label: 'TR' },
];

// ─── Country data ─────────────────────────────────────────────────────────────

const STATIC_COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
];

const POPULAR_CODES = ['SA', 'EG', 'AE', 'CN', 'PK', 'IN', 'PH'];

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

  const countries = apiCountries?.length ? apiCountries : STATIC_COUNTRIES;

  const popularCountries = POPULAR_CODES
    .map(code => countries.find(c => c.code === code))
    .filter(Boolean) as typeof countries;

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

  // Close lang menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
      <div className="w-full max-w-[720px] flex flex-col bg-white overflow-hidden" style={{ height: '100dvh' }}>

        {/* ── Header ── */}
        <header className="flex items-center justify-between px-3 py-2.5 bg-white border-b shrink-0 z-10" style={{ minHeight: 56 }}>
          {/* Left: back + logo + title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 md:hidden shrink-0"
              data-testid="btn-back"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Building2 className="w-[18px] h-[18px] text-amber-600" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[14px] leading-tight text-gray-900 truncate">{t.title}</p>
              <p className="text-[11px] text-green-600 font-medium">{t.online}</p>
            </div>
          </div>

          {/* Right: language selector + menu */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Language selector */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(v => !v)}
                className="flex items-center gap-0.5 px-2 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-[12px] font-semibold text-gray-700 transition-colors"
                data-testid="btn-lang-selector"
                aria-label="Select language"
              >
                {lang}
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {langMenuOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-[64px]">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                      className={`w-full px-3 py-2 text-[13px] font-medium text-left hover:bg-gray-50 transition-colors ${lang === l.code ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}`}
                      data-testid={`btn-lang-${l.code}`}
                    >
                      {l.label}
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
              <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center shadow-sm">
                <Building2 className="w-4 h-4 text-amber-600" />
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
                <h3 className="font-semibold text-[14px] text-gray-800 mb-2.5">{t.myPassport}</h3>

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
                    <p className="text-[11px] text-gray-400 font-medium mb-1.5">{t.popular}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularCountries.map(c => (
                        <button
                          key={c.code}
                          onClick={() => handleSelectCountry(c.code)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 transition-all text-[12px] font-medium"
                          data-testid={`btn-popular-${c.code}`}
                        >
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="text-gray-700">{c.code}</span>
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
                      className="w-full flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                      data-testid={`btn-country-${c.code}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg leading-none">{c.flag}</span>
                        <span className="font-medium text-[14px] text-gray-800">{c.name}</span>
                      </div>
                      <span className="text-[12px] text-gray-400 font-medium">{c.code}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <p className="text-center py-4 text-[13px] text-gray-400">{t.noCountries}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Conversation (State 2) ── */}
            {sessionId && (
              <>
                {selectedCountryData && (
                  <div className="flex items-end justify-end gap-2 animate-in fade-in slide-in-from-right-3 duration-300">
                    <div className="bg-[#1A2942] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm text-[14px] max-w-[75%]">
                      {selectedCountryData.flag} {selectedCountryData.code}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
                  <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center shadow-sm">
                    <Building2 className="w-4 h-4 text-amber-600" />
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
                      <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center shadow-sm">
                        <Building2 className="w-4 h-4 text-amber-600" />
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
                    <div className="w-8 h-8 rounded-full bg-amber-100 shrink-0 flex items-center justify-center shadow-sm">
                      <Building2 className="w-4 h-4 text-amber-600" />
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
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: 8, paddingLeft: 12, paddingRight: 12 }}
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

          {/* Trust footer — single line, never overlaps composer */}
          <p className="text-center text-[11px] text-gray-400 mt-1.5 leading-none">
            {t.footer}
          </p>
        </div>

      </div>
    </div>
  );
}
