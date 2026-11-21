import { useState, useRef, useEffect } from 'react';

interface Msg { role: 'user' | 'bot'; text: string }

/**
 * Bottom-sheet AI chat drawer.
 * Closed: small bottom-right launcher (above the bottom nav, safe-area aware).
 * Open: chat panel slides up from the bottom, sits above the bottom nav,
 * scrolls internally.
 */
export default function AskAIDrawer({ countryId, countryName }: { countryId: string; countryName?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: `Hi! Ask me anything about travelling to Türkiye${countryName ? ` with a ${countryName} passport` : ''}.` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/travel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId,
          message: text,
          history: messages.map(m => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'bot', text: data.reply_text || data.error || 'Sorry, something went wrong. Please try again.' }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Bottom nav is 60px tall; keep everything above it + device safe area.
  const aboveNav = 'calc(60px + env(safe-area-inset-bottom))';

  return (
    <>
      {/* ── Launcher (closed state) ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask AI"
          className="fixed right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full text-xl text-white shadow-lg"
          style={{
            bottom: `calc(72px + env(safe-area-inset-bottom))`,
            background: 'linear-gradient(135deg, #c5a059, #a07830)',
          }}
        >
          🕌
        </button>
      )}

      {/* ── Bottom sheet (open state) ── */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,.25)' }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-0 right-0 z-50 flex flex-col rounded-t-2xl shadow-2xl"
            style={{
              bottom: aboveNav,
              // 45–60% of viewport: top edge stays in the lower half of the screen
              height: 'min(52dvh, 480px)',
              minHeight: '45dvh',
              maxHeight: '60dvh',
              background: '#fff',
              borderTop: '1px solid #e5e7eb',
              animation: 'askai-slide-up .25s ease-out',
            }}
          >
            <style>{`@keyframes askai-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0 rounded-t-2xl"
              style={{ borderBottom: '1px solid #e5e7eb' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-base"
                  style={{ background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)' }}
                >
                  🕌
                </span>
                <span className="font-semibold text-[14px] text-gray-900">Türkiye Entry Guide</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Messages (scrolls inside the panel) */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2" style={{ background: '#f4f6f9' }}>
              {messages.map((m, i) =>
                m.role === 'bot' ? (
                  <div
                    key={i}
                    className="self-start px-3.5 py-2.5 text-[13px] text-gray-800 leading-relaxed whitespace-pre-line"
                    style={{ background: '#fff', borderRadius: '14px 14px 14px 4px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', maxWidth: '85%' }}
                  >
                    {m.text}
                  </div>
                ) : (
                  <div
                    key={i}
                    className="self-end px-3.5 py-2.5 text-[13px] text-white leading-relaxed"
                    style={{ background: '#0a1f44', borderRadius: '14px 4px 14px 14px', maxWidth: '80%' }}
                  >
                    {m.text}
                  </div>
                ),
              )}
              {loading && (
                <div
                  className="self-start px-4 py-3 flex gap-1"
                  style={{ background: '#fff', borderRadius: '14px 14px 14px 4px', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}
                >
                  {['-0.3s', '-0.15s', '0s'].map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#9ca3af', animationDelay: d }} />
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 flex gap-2 px-3 py-2.5" style={{ borderTop: '1px solid #e5e7eb', background: '#fff' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about documents, stay length…"
                className="flex-1 min-w-0 border border-gray-200 rounded-2xl px-3 py-2 text-[13px] text-gray-800 bg-gray-50 outline-none"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                aria-label="Send"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm shrink-0 disabled:opacity-40"
                style={{ background: '#0a1f44' }}
              >
                ➤
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
