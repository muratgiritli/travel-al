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
  PlusCircle,
  Clock,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateChatSession,
  useDeleteChatSession,
  useGetChatMessages,
  useGetChatSession,
  useListCountries,
  useListChatSessions,
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
      onError={e => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
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
    newConversation: 'New conversation',
    previousConversations: 'Previous conversations',
    resumeConversation: 'Resume',
    noSnippet: 'Started a new conversation',
    deleteConversation: 'Delete',
    renameConversation: 'Rename',
    renamePlaceholder: 'Name this conversation…',
    cancelRename: 'Cancel',
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
    newConversation: 'Nueva conversación',
    previousConversations: 'Conversaciones anteriores',
    resumeConversation: 'Reanudar',
    noSnippet: 'Inició una nueva conversación',
    deleteConversation: 'Eliminar',
    renameConversation: 'Renombrar',
    renamePlaceholder: 'Nombra esta conversación…',
    cancelRename: 'Cancelar',
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
    newConversation: 'محادثة جديدة',
    previousConversations: 'المحادثات السابقة',
    resumeConversation: 'استئناف',
    noSnippet: 'بدأت محادثة جديدة',
    deleteConversation: 'حذف',
    renameConversation: 'إعادة تسمية',
    renamePlaceholder: 'سمِّ هذه المحادثة…',
    cancelRename: 'إلغاء',
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
    newConversation: 'Nouvelle conversation',
    previousConversations: 'Conversations précédentes',
    resumeConversation: 'Reprendre',
    noSnippet: 'Démarré une nouvelle conversation',
    deleteConversation: 'Supprimer',
    renameConversation: 'Renommer',
    renamePlaceholder: 'Nommer cette conversation…',
    cancelRename: 'Annuler',
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
    newConversation: 'Yeni konuşma',
    previousConversations: 'Önceki konuşmalar',
    resumeConversation: 'Devam et',
    noSnippet: 'Yeni bir konuşma başlatıldı',
    deleteConversation: 'Sil',
    renameConversation: 'Yeniden adlandır',
    renamePlaceholder: 'Bu konuşmayı adlandırın…',
    cancelRename: 'İptal',
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

// ─── Device ID (cookie-based, survives localStorage clears) ──────────────────

const DEVICE_ID_COOKIE = 'turkey_device_id';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getOrCreateDeviceId(): string {
  let id = getCookie(DEVICE_ID_COOKIE);
  if (!id) {
    id = generateUUID();
    setCookie(DEVICE_ID_COOKIE, id, 365);
  }
  return id;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_CURRENT = 'turkey_travel_session';
const LS_HISTORY = 'turkey_travel_sessions';

interface StoredSession {
  id: string;
  passportCountryCode: string;
  snippet: string;
  createdAt: string;
  label?: string;
}

function readCurrentSession(): { sessionId: string; passportCountryCode: string } | null {
  try {
    const raw = localStorage.getItem(LS_CURRENT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.sessionId && parsed?.passportCountryCode) return parsed;
  } catch {}
  return null;
}

function saveCurrentSession(sessionId: string, passportCountryCode: string) {
  localStorage.setItem(LS_CURRENT, JSON.stringify({ sessionId, passportCountryCode }));
}

function clearCurrentSession() {
  localStorage.removeItem(LS_CURRENT);
}

function readSessionHistory(): StoredSession[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
}

function upsertSessionHistory(session: StoredSession) {
  const history = readSessionHistory();
  const idx = history.findIndex(s => s.id === session.id);
  if (idx !== -1) {
    history[idx] = { ...history[idx], ...session };
  } else {
    history.unshift(session);
  }
  localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 10)));
}

function removeSessionFromHistory(sessionId: string) {
  const history = readSessionHistory().filter(s => s.id !== sessionId);
  localStorage.setItem(LS_HISTORY, JSON.stringify(history));
}

function renameSessionInHistory(sessionId: string, label: string) {
  const history = readSessionHistory();
  const idx = history.findIndex(s => s.id === sessionId);
  if (idx !== -1) {
    history[idx] = { ...history[idx], label: label.trim() || undefined };
    localStorage.setItem(LS_HISTORY, JSON.stringify(history));
  }
}

// ─── Message types ────────────────────────────────────────────────────────────
// The single messages array is the source of truth for NEW conversations.
// All content — bot responses, user bubbles, and the picker widget — lives here.
// For RESTORED sessions, apiMessages from the server is used instead.

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

type LocalChatMessage = BotMessage | UserMessage | WidgetMessage;

let msgCounter = 0;
const nextId = () => `msg-${++msgCounter}`;

const makeInitialMessages = (): LocalChatMessage[] => [
  { kind: 'bot', id: nextId(), text: '', i18nKey: 'welcome' },
  { kind: 'widget', id: nextId(), widgetType: 'country-picker', status: 'active' },
];

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
  // null = not streaming; string = actively streaming bot reply (grows token by token)
  const [streamingBotText, setStreamingBotText] = useState<string | null>(null);
  const [historyTrimmed, setHistoryTrimmed] = useState(false);
  // Optimistic user message shown during streaming for restored sessions
  const [streamingUserText, setStreamingUserText] = useState<string | null>(null);

  // Local message array — used for NEW conversations (widget architecture)
  const [messages, setMessages] = useState<LocalChatMessage[]>(makeInitialMessages);

  // Session persistence state
  // isRestored = true when we loaded a previous session from localStorage
  const [isRestored, setIsRestored] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<StoredSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  // Stable device ID stored in a cookie — survives localStorage clears
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];
  const queryClient = useQueryClient();

  // API hooks
  const { data: apiCountries } = useListCountries();
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();

  // Fetch session list from server — this is the durable source of truth
  const { data: serverSessions } = useListChatSessions(
    { deviceId },
    { query: { queryKey: ['chatSessions', deviceId], staleTime: 30_000 } },
  );

  // Used only when restoring a previous session — fetches historical messages
  const { data: apiMessages } = useGetChatMessages(sessionId || '', {
    query: { enabled: !!sessionId && isRestored, queryKey: ['chatMessages', sessionId] },
  });
  // Validates that the restored session still exists on the server (retry:false = no retries on 404)
  const { error: sessionError } = useGetChatSession(sessionId || '', {
    query: { enabled: !!sessionId && isRestored, retry: false, queryKey: ['chatSession', sessionId] },
  });

  const countries: { code: string; name: string }[] =
    apiCountries?.length
      ? apiCountries.map(c => ({ code: c.code, name: c.name }))
      : STATIC_COUNTRIES;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const appendMessage = useCallback((msg: LocalChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateWidget = useCallback((id: string, patch: Partial<WidgetMessage>) => {
    setMessages(prev =>
      prev.map(m => (m.id === id && m.kind === 'widget' ? { ...m, ...patch } : m)),
    );
  }, []);

  // ── Restore session from localStorage on first mount ──────────────────────

  useEffect(() => {
    const stored = readCurrentSession();
    if (stored) {
      setSessionId(stored.sessionId);
      setSelectedCountry(stored.passportCountryCode);
      setIsRestored(true);
      setIsUnlocked(true);
    }
    setSessionHistory(readSessionHistory());
  }, []);

  // ── Seed localStorage from server sessions when they arrive ───────────────
  // Server is the durable source of truth. Merge server sessions into the
  // local cache so history survives browser storage clears.

  useEffect(() => {
    if (!serverSessions) return;
    serverSessions.forEach(s => {
      const existing = readSessionHistory().find(h => h.id === s.id);
      upsertSessionHistory({
        id: s.id,
        passportCountryCode: s.passportCountryCode,
        snippet: existing?.snippet ?? '',
        createdAt: s.createdAt.toString(),
        label: existing?.label,
      });
    });
    setSessionHistory(readSessionHistory());
  }, [serverSessions]);

  // ── If restored session is gone (confirmed 404 only), clear and reset ────
  // Only wipe persisted state on HTTP 404 — transient network/server errors
  // must NOT delete a valid saved session from localStorage.

  useEffect(() => {
    const is404 = sessionError != null && (sessionError as { status?: number }).status === 404;
    if (is404 && sessionId && isRestored) {
      clearCurrentSession();
      removeSessionFromHistory(sessionId);
      setSessionId(null);
      setSelectedCountry(null);
      setIsRestored(false);
      setIsUnlocked(false);
      setMessages(makeInitialMessages());
      setHistoryTrimmed(false);
      setSessionHistory(readSessionHistory());
    }
  }, [sessionError, sessionId, isRestored]);

  // ── Update session snippet from first user message (restored sessions) ────

  useEffect(() => {
    if (apiMessages && apiMessages.length > 0 && sessionId && selectedCountry && isRestored) {
      const firstUserMsg = apiMessages.find(m => m.role === 'user');
      if (firstUserMsg) {
        const snippet =
          firstUserMsg.text.slice(0, 70) + (firstUserMsg.text.length > 70 ? '…' : '');
        upsertSessionHistory({
          id: sessionId,
          passportCountryCode: selectedCountry,
          snippet,
          createdAt: apiMessages[0].createdAt.toString(),
        });
        setSessionHistory(readSessionHistory());
      }
    }
  }, [apiMessages, sessionId, selectedCountry, isRestored]);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, apiMessages, isTyping, streamingBotText]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [inputValue]);

  // ── Lang menu: close on outside click or Escape ───────────────────────────

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

  // ── Country selection handler ─────────────────────────────────────────────

  const handleSelectCountry = useCallback(
    (countryCode: string) => {
      const widgetMsg = messages.find(
        m => m.kind === 'widget' && (m as WidgetMessage).status === 'active',
      ) as WidgetMessage | undefined;
      if (!widgetMsg) return;

      // Collapse picker in-place, append user bubble
      updateWidget(widgetMsg.id, { status: 'completed', selectedCode: countryCode });
      appendMessage({ kind: 'user', id: nextId(), text: countryCode, countryCode });
      setSelectedCountry(countryCode);
      setShowHistory(false);

      createSession.mutate(
        { data: { passportCountryCode: countryCode, deviceId } },
        {
          onSuccess: session => {
            setSessionId(session.id);
            setIsUnlocked(true);
            appendMessage({ kind: 'bot', id: nextId(), text: '', i18nKey: 'howCanIHelp' });
            // Persist to localStorage
            saveCurrentSession(session.id, countryCode);
            upsertSessionHistory({
              id: session.id,
              passportCountryCode: countryCode,
              snippet: '',
              createdAt: new Date().toISOString(),
            });
            setSessionHistory(readSessionHistory());
          },
        },
      );
    },
    [messages, appendMessage, updateWidget, createSession, deviceId],
  );

  // ── Resume a previous session ─────────────────────────────────────────────

  const handleResumeSession = useCallback((stored: StoredSession) => {
    setSessionId(stored.id);
    setSelectedCountry(stored.passportCountryCode);
    setIsRestored(true);
    setIsUnlocked(true);
    setShowHistory(false);
    setHistoryTrimmed(false);
    saveCurrentSession(stored.id, stored.passportCountryCode);
  }, []);

  // ── Delete a session from history ─────────────────────────────────────────

  const handleDeleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove from local cache immediately for a snappy UI
    removeSessionFromHistory(sessionId);
    setSessionHistory(readSessionHistory());
    if (renamingSessionId === sessionId) setRenamingSessionId(null);
    // Persist the deletion to the server so it doesn't come back on next load
    deleteSession.mutate({ sessionId });
  }, [renamingSessionId, deleteSession]);

  // ── Start rename flow ─────────────────────────────────────────────────────

  const handleStartRename = useCallback((session: StoredSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingSessionId(session.id);
    setRenameInput(session.label ?? '');
  }, []);

  // ── Commit rename ─────────────────────────────────────────────────────────

  const handleCommitRename = useCallback((sessionId: string) => {
    renameSessionInHistory(sessionId, renameInput);
    setSessionHistory(readSessionHistory());
    setRenamingSessionId(null);
    setRenameInput('');
  }, [renameInput]);

  // ── Start a fresh conversation ────────────────────────────────────────────

  const handleNewConversation = useCallback(() => {
    clearCurrentSession();
    setSessionId(null);
    setSelectedCountry(null);
    setIsRestored(false);
    setIsUnlocked(false);
    setInputValue('');
    setMessages(makeInitialMessages());
    setHistoryTrimmed(false);
  }, []);

  // ── Send message handler (SSE streaming) ─────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || !sessionId || isTyping || streamingBotText !== null) return;
    setInputValue('');

    if (!isRestored) {
      appendMessage({ kind: 'user', id: nextId(), text });
    } else {
      setStreamingUserText(text);
    }

    // Show typing indicator until the first token arrives
    setIsTyping(true);

    let fullText = '';
    let firstToken = true;
    let encounteredError = false;

    const finalize = (errorText?: string) => {
      // Always clear transient streaming + typing state
      setIsTyping(false);
      setStreamingBotText(null);
      setStreamingUserText(null);

      if (errorText) {
        appendMessage({ kind: 'bot', id: nextId(), text: errorText });
        return;
      }

      if (!isRestored) {
        if (fullText) {
          appendMessage({ kind: 'bot', id: nextId(), text: fullText });
        }
      } else {
        // Refresh from server so restored session history is up to date
        queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] });
      }
    };

    try {
      const response = await fetch(`/api/chat/session/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok || !response.body) {
        finalize("I'm sorry, I couldn't get a response. Please try again.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;

          // Server notifies that old messages were trimmed from context
          if (payload === '[TRIMMED]') {
            setHistoryTrimmed(true);
            continue;
          }

          // Server signals an AI error — treat as terminal failure
          if (payload.startsWith('[ERROR]')) {
            encounteredError = true;
            break;
          }

          // Unescape newlines encoded by the server
          const token = payload.replace(/\\n/g, '\n');
          fullText += token;

          if (firstToken) {
            firstToken = false;
            // Hide typing indicator the moment the first token arrives
            setIsTyping(false);
            setStreamingBotText('');
          }
          setStreamingBotText(fullText);
        }

        if (encounteredError) break;
      }
    } catch {
      finalize("I'm sorry, I couldn't get a response. Please try again.");
      return;
    }

    if (encounteredError) {
      finalize("I'm sorry, I couldn't get a response. Please try again.");
    } else {
      finalize();
    }
  }, [inputValue, sessionId, isRestored, isTyping, streamingBotText, appendMessage, queryClient]);

  const isRtl = lang === 'AR';
  const pastSessions = sessionHistory.filter(s => s.id !== sessionId);

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
            <button className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 md:hidden shrink-0" data-testid="btn-back" aria-label="Back">
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
            {/* Language selector */}
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

            {/* New conversation — visible when an active session exists */}
            {sessionId && (
              <button
                onClick={handleNewConversation}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                data-testid="btn-new-conversation"
                aria-label={t.newConversation}
                title={t.newConversation}
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            )}

            {/* History — visible when no active session and history exists */}
            {!sessionId && pastSessions.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className={`p-1.5 rounded-full transition-colors ${showHistory ? 'bg-gray-100 text-gray-700' : 'hover:bg-gray-100 text-gray-500'}`}
                data-testid="btn-show-history"
                aria-label={t.previousConversations}
                title={t.previousConversations}
              >
                <Clock className="w-5 h-5" />
              </button>
            )}

            <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500" data-testid="btn-menu" aria-label="Menu">
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

            {/* ── Previous conversations panel ── */}
            {!sessionId && showHistory && pastSessions.length > 0 && (
              <div className="ml-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-2 px-1">
                  {t.previousConversations}
                </p>
                <div className="flex flex-col gap-2">
                  {pastSessions.map(session => {
                    const countryData = countries.find(c => c.code === session.passportCountryCode);
                    const isRenaming = renamingSessionId === session.id;
                    return (
                      <div
                        key={session.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        {/* ── Rename row (shown when editing) ── */}
                        {isRenaming && (
                          <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-gray-100 animate-in fade-in duration-150">
                            <input
                              autoFocus
                              type="text"
                              value={renameInput}
                              onChange={e => setRenameInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleCommitRename(session.id);
                                if (e.key === 'Escape') { setRenamingSessionId(null); setRenameInput(''); }
                              }}
                              placeholder={t.renamePlaceholder}
                              className="flex-1 text-[13px] text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
                              data-testid={`input-rename-${session.id}`}
                            />
                            <button
                              onClick={() => handleCommitRename(session.id)}
                              className="shrink-0 w-7 h-7 rounded-full bg-[#1A2942] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                              aria-label="Save name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setRenamingSessionId(null); setRenameInput(''); }}
                              className="shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                              aria-label={t.cancelRename}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* ── Main card row ── */}
                        <div className="flex items-center gap-3 px-3.5 py-3">
                          {/* Flag circle */}
                          <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 shrink-0 flex items-center justify-center">
                            <FlagImg code={session.passportCountryCode} size={18} />
                          </div>

                          {/* Text — tappable to resume */}
                          <button
                            onClick={() => handleResumeSession(session)}
                            className="min-w-0 flex-1 text-left"
                            data-testid={`btn-resume-session-${session.id}`}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {session.label ? (
                                <span className="font-semibold text-[13px] text-gray-800 truncate">
                                  {session.label}
                                </span>
                              ) : (
                                <>
                                  <span className="font-semibold text-[13px] text-gray-800">
                                    {countryData?.name ?? session.passportCountryCode}
                                  </span>
                                  <span className="text-[11px] text-gray-400 font-medium shrink-0">
                                    {session.passportCountryCode}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-[12px] text-gray-500 truncate">
                              {session.snippet || t.noSnippet}
                            </p>
                          </button>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={e => handleStartRename(session, e)}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              aria-label={t.renameConversation}
                              title={t.renameConversation}
                              data-testid={`btn-rename-session-${session.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => handleDeleteSession(session.id, e)}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              aria-label={t.deleteConversation}
                              title={t.deleteConversation}
                              data-testid={`btn-delete-session-${session.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] text-[#1A2942] font-semibold shrink-0 bg-blue-50 px-2 py-0.5 rounded-full ml-1">
                              {t.resumeConversation}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── NEW conversation: render local messages array (widgets + bubbles) ── */}
            {!isRestored && messages.map(msg => {
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

            {/* ── RESTORED conversation: welcome + country badge + history from API ── */}
            {isRestored && (
              <>
                {/* Welcome */}
                <div className="flex items-start gap-2 animate-in fade-in duration-300">
                  <BotAvatar />
                  <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-[14px] text-gray-800 max-w-[85%] leading-relaxed">
                    {t.welcome}
                  </div>
                </div>

                {/* Passport country badge */}
                {selectedCountry && (
                  <CompletedPickerBadge code={selectedCountry} t={t} />
                )}

                {/* "How can I help?" */}
                <div className="flex items-start gap-2 animate-in fade-in duration-300">
                  <BotAvatar />
                  <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-[14px] text-gray-800 max-w-[85%] leading-relaxed">
                    {t.howCanIHelp}
                  </div>
                </div>

                {/* Historical messages from server */}
                {apiMessages?.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'items-end justify-end' : 'items-start'} gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {msg.role === 'assistant' && <BotAvatar />}
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
              </>
            )}

            {/* History trimming notice — shown once trimming has occurred */}
            {historyTrimmed && (
              <div className="flex justify-center animate-in fade-in duration-500">
                <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  Earlier messages are no longer included for efficiency
                </span>
              </div>
            )}

            {/* Optimistic user message during streaming (restored sessions only) */}
            {isRestored && streamingUserText !== null && (
              <div className="flex items-end justify-end gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="bg-[#1A2942] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm text-[14px] max-w-[75%]">
                  <span className="whitespace-pre-wrap">{streamingUserText}</span>
                </div>
              </div>
            )}

            {/* Streaming bot reply — grows token by token */}
            {streamingBotText !== null && (
              <div className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <BotAvatar />
                <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-[14px] text-gray-800 max-w-[85%] leading-relaxed whitespace-pre-wrap">
                  {streamingBotText}
                  <span className="inline-block w-[2px] h-[14px] bg-gray-400 ml-0.5 align-middle animate-pulse" />
                </div>
              </div>
            )}

            {/* Typing indicator — shown until the first streaming token arrives */}
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
          {/* New conversation shortcut — below composer when in a session */}
          {sessionId && (
            <div className="flex justify-center mb-1.5">
              <button
                onClick={handleNewConversation}
                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors px-3 py-0.5 rounded-full hover:bg-gray-50"
                data-testid="btn-new-conversation-inline"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.newConversation}</span>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-3xl px-1.5 py-1 focus-within:bg-white focus-within:border-blue-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 shrink-0 rounded-full transition-colors"
              disabled={!isUnlocked}
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
              <button className="p-2 text-gray-400 hover:text-gray-600 shrink-0 rounded-full transition-colors" data-testid="btn-mic" aria-label="Voice input">
                <Mic className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!isUnlocked || !inputValue.trim() || isTyping || streamingBotText !== null}
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
