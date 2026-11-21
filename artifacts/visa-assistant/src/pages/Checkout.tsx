import { useState } from 'react';
import { Link } from 'wouter';
import { useSettings } from '@/lib/settings';

/**
 * Insurance checkout page (route: /checkout).
 * Target of the "Get travel insurance" CTA. Simple day/traveler
 * calculator that continues into the application flow at /next.
 */
export default function Checkout() {
  const { settings } = useSettings();
  const { pricing, brand, chat } = settings;
  const ins = pricing.insurance;

  const [days, setDays] = useState(10);
  const [travelers, setTravelers] = useState(1);

  const safeDays = Math.max(ins.min_days || 1, days || 1);
  const safeTravelers = Math.max(1, travelers || 1);
  const total = ins.daily_price * safeDays * (ins.per_traveler ? safeTravelers : 1);
  const currency = pricing.fees.currency || 'USD';

  const bottomPad = 'max(28px, calc(16px + env(safe-area-inset-bottom)))';

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f9' }}>
      {/* ── Header (chat chrome only) ── */}
      <header className="px-4 py-3" style={{ background: '#0a1f44' }}>
        <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="shrink-0 overflow-hidden relative"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#E30A17',
                border: '1px solid rgba(255,255,255,.25)',
              }}
              aria-hidden
            >
              <svg viewBox="0 0 36 36" width={34} height={34} className="block">
                <circle cx="14.8" cy="18" r="7.6" fill="#fff" />
                <circle cx="17.2" cy="18" r="6.1" fill="#E30A17" />
                <polygon
                  fill="#fff"
                  transform="translate(23.4,18) rotate(-10) scale(0.42) translate(-12,-12)"
                  points="12,2.5 14.4,9.2 21.5,9.2 15.8,13.4 18.1,20.2 12,15.9 5.9,20.2 8.2,13.4 2.5,9.2 9.6,9.2"
                />
              </svg>
            </div>
            <span className="text-white font-bold text-[15px] leading-tight">{brand.site_name}</span>
          </Link>
          <Link href="/" className="text-[13px] text-white/80 hover:text-white font-medium">← Back to chat</Link>
        </div>
      </header>

      <main
        className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4"
        style={{ paddingBottom: bottomPad }}
      >
        <div className="text-center">
          <h1 className="font-black text-[26px] text-gray-900 leading-tight">Travel health insurance</h1>
          <p className="text-[14px] text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            {chat.insurance_required_message}
          </p>
        </div>

        {/* ── Calculator ── */}
        <div
          className="rounded-2xl p-5 shadow-sm flex flex-col gap-4"
          style={{ background: '#fff', border: '1px solid #e5e7eb' }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="days" className="text-[13px] font-semibold text-gray-700">
              Days of coverage
            </label>
            <input
              id="days"
              type="number"
              min={ins.min_days || 1}
              value={days}
              onChange={e => setDays(parseInt(e.target.value, 10) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-800 bg-gray-50 outline-none focus:border-gray-400"
            />
          </div>
          {ins.per_traveler && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="travelers" className="text-[13px] font-semibold text-gray-700">
                Travelers
              </label>
              <input
                id="travelers"
                type="number"
                min={1}
                value={travelers}
                onChange={e => setTravelers(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-800 bg-gray-50 outline-none focus:border-gray-400"
              />
            </div>
          )}

          <div
            className="rounded-xl px-4 py-3"
            style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500">
                ${ins.daily_price}/day × {safeDays} day{safeDays !== 1 ? 's' : ''}
                {ins.per_traveler ? ` × ${safeTravelers} traveler${safeTravelers !== 1 ? 's' : ''}` : ''}
              </span>
              <span className="font-black text-[18px] text-gray-900">${total} {currency}</span>
            </div>
            {ins.example_text && (
              <p className="text-[12px] text-gray-400 mt-1">{ins.example_text}</p>
            )}
          </div>

          <Link
            href="/next"
            className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #C73E54, #A82E42)' }}
          >
            CONTINUE
          </Link>
          <p className="text-center text-[11px] text-gray-400">
            Instant PDF • Border-ready • Cancel anytime
          </p>
        </div>

        {brand.footer_text && (
          <p className="text-center text-[11px] text-gray-400 mt-2">{brand.footer_text}</p>
        )}
      </main>
    </div>
  );
}
