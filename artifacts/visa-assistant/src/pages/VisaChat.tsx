import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';

interface Country {
  id: string; name: string; iso2: string; flag_emoji: string; visa_summary: string;
}

interface VisaCardData {
  country: string; iso2: string; flag_emoji: string;
  visa_status: string; insurance_required: boolean;
  headline: string; body: string[];
  features: string[]; price_label: string; price_example: string; cta: string;
  admin_html_notes: string;
}

interface ChatMessage {
  role: 'bot' | 'user' | 'system';
  text: string;
  card?: VisaCardData | null;
}

// ─── Visa Card ────────────────────────────────────────────────────────────────

function VisaCard({ card }: { card: VisaCardData }) {
  const icons = ['🛡️', '📄', '✅'];
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mt-2 ml-10">
      {/* Flags */}
      <div className="flex items-center gap-2 text-[14px] font-medium text-gray-800 mb-3">
        <span>{card.flag_emoji} {card.country}</span>
        <span className="text-gray-400">→</span>
        <span>🇹🇷 Türkiye</span>
      </div>
      {/* Pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-green-50 text-green-700 border border-green-100">
          {card.visa_status}
        </span>
        {card.insurance_required && (
          <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-orange-50 text-orange-700 border border-orange-100">
            Insurance required
          </span>
        )}
      </div>
      {/* Headline */}
      <h2 className="font-semibold text-[15px] text-gray-900 mb-2">{card.headline}</h2>
      {/* Body */}
      {card.body.map((p, i) => (
        <p key={i} className="text-[13px] text-gray-600 mb-1.5 leading-relaxed">{p}</p>
      ))}
      {/* Features */}
      <div className="flex flex-col gap-2 mt-3 mb-3">
        {card.features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
            <span className="text-base">{icons[i] ?? '•'}</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      {/* Price box */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-3">
        <div className="font-semibold text-[14px] text-gray-900">{card.price_label}</div>
        <div className="text-[12px] text-gray-500 mt-0.5">{card.price_example}</div>
      </div>
      {/* CTA */}
      <a
        href="/visa/checkout"
        className="block w-full text-center bg-[#0a1f44] text-white py-3 rounded-xl font-semibold text-[14px] hover:bg-[#132b57] transition-colors mb-2"
      >
        {card.cta}
      </a>
      <button
        className="w-full text-center text-[13px] text-[#0a1f44] hover:underline py-1"
        onClick={() => {
          const input = document.querySelector<HTMLInputElement>('#messageInput');
          if (input) { input.focus(); input.placeholder = 'Ask about insurance, stay length, documents...'; }
        }}
      >
        Ask a question
      </button>
      <div className="text-center text-[11px] text-gray-400 mt-2">
        Instant PDF • Border-ready • Cancel anytime
      </div>
      {/* Admin HTML notes */}
      {card.admin_html_notes && (
        <div
          className="mt-3 pt-3 border-t border-gray-100 text-[13px] text-gray-600 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: card.admin_html_notes }}
        />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VisaChat() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', text: 'Welcome. I can check visa rules for Türkiye. Which passport do you hold?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/visa/countries')
      .then(r => r.json())
      .then(d => setCountries(d.countries ?? []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const addMsg = (msg: ChatMessage) => setMessages(prev => [...prev, msg]);

  const handleCheck = async () => {
    const country = countries.find(c => c.id === selectedId);
    if (!country) {
      addMsg({ role: 'bot', text: 'Please select your passport country first.' });
      return;
    }
    addMsg({ role: 'user', text: `I have a ${country.name} passport.` });
    addMsg({ role: 'system', text: 'Passport selected.' });
    addMsg({ role: 'user', text: 'Do I need a visa for Turkey?' });
    setLoading(true);
    try {
      const res = await fetch('/api/visa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryId: selectedId, message: 'Do I need a visa for Turkey?' }),
      });
      const data = await res.json();
      addMsg({ role: 'bot', text: data.reply_text, card: data.card });
      setUnlocked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedId) return;
    setInputValue('');
    addMsg({ role: 'user', text });
    setLoading(true);
    try {
      const res = await fetch('/api/visa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryId: selectedId, message: text }),
      });
      const data = await res.json();
      addMsg({ role: 'bot', text: data.reply_text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#f4f6f9' }}
    >
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 430,
          height: 'min(860px, calc(100vh - 2rem))',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 24,
          boxShadow: '0 8px 28px rgba(10,31,68,.08)',
        }}
      >
        {/* ── Header ── */}
        <header
          className="flex items-center gap-3 px-4 shrink-0"
          style={{ borderBottom: '1px solid #e5e7eb', minHeight: 60, background: '#fff' }}
        >
          <div
            className="shrink-0 flex items-center justify-center text-xl"
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)',
            }}
          >
            🕌
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] text-gray-900">Turkey Travel Assistant</div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: '#16a34a' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#16a34a' }} />
              Online
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <select
              className="text-[12px] font-semibold border border-gray-200 rounded-full px-2.5 py-1 bg-gray-50 text-gray-700"
              aria-label="Language"
            >
              <option>EN</option>
            </select>
            <Link
              href="/admin"
              className="text-[12px] text-gray-500 hover:text-gray-700 font-medium"
            >
              Admin
            </Link>
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
                <div className="text-center text-[12px] text-gray-400 my-1 font-medium">
                  {msg.text}
                </div>
              )}
              {msg.role === 'bot' && (
                <div className="flex items-start gap-2">
                  <div
                    className="shrink-0 flex items-center justify-center text-sm"
                    style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)',
                    }}
                  >
                    🕌
                  </div>
                  <div
                    className="px-3.5 py-2.5 text-[14px] text-gray-800 leading-relaxed"
                    style={{
                      background: '#fff', borderRadius: '16px 16px 16px 4px',
                      boxShadow: '0 1px 3px rgba(0,0,0,.06)', maxWidth: '85%',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              )}
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div
                    className="px-3.5 py-2.5 text-[14px] text-white leading-relaxed"
                    style={{
                      background: '#0a1f44', maxWidth: '75%',
                      borderRadius: '16px 4px 16px 16px',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              )}
              {msg.card && <VisaCard card={msg.card} />}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div
                className="shrink-0 flex items-center justify-center text-sm"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)',
                }}
              >
                🕌
              </div>
              <div
                className="px-4 py-3.5 flex gap-1"
                style={{ background: '#fff', borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
              >
                {['-0.3s', '-0.15s', '0s'].map((d, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: '#9ca3af', animationDelay: d }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Composer ── */}
        <div
          className="shrink-0 flex flex-col gap-2 px-3 py-3"
          style={{ borderTop: '1px solid #e5e7eb', background: '#fff' }}
        >
          {/* Country selector row */}
          <div className="flex gap-2">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-[13px] text-gray-700 bg-white outline-none"
              aria-label="Select passport country"
            >
              <option value="">Select your passport country…</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
              ))}
            </select>
            <button
              onClick={handleCheck}
              disabled={!selectedId || loading}
              className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors shrink-0 disabled:opacity-50"
              style={{ background: '#0a1f44' }}
            >
              Check
            </button>
          </div>

          {/* Message input row — shown after country selected */}
          {unlocked && (
            <div className="flex gap-2">
              <div
                className="flex-1 flex items-center gap-2 border border-gray-200 rounded-2xl px-3 py-1.5"
                style={{ background: '#f9fafb' }}
              >
                <span className="text-gray-400 text-sm">📎</span>
                <input
                  id="messageInput"
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Message Turkey Travel Assistant..."
                  className="flex-1 bg-transparent outline-none text-[14px] text-gray-800 placeholder:text-gray-400"
                />
                <span className="text-gray-400 text-sm">🎤</span>
              </div>
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || loading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0 disabled:opacity-40 transition-colors"
                style={{ background: '#0a1f44' }}
                aria-label="Send"
              >
                ➤
              </button>
            </div>
          )}

          <div className="text-center text-[11px] text-gray-400">
            AI guidance • Human travel experts available.
          </div>
        </div>
      </div>
    </div>
  );
}
