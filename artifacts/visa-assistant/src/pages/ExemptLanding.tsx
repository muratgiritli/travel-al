import { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';

interface CountryData {
  id: string;
  name: string;
  flag_emoji: string;
  visa_summary?: string;
  stay_rule?: string;
  headline?: string;
  features?: string[];
  price_label?: string;
  price_example?: string;
  cta?: string;
  cta_href?: string;
}

/**
 * Landing page for permit-exempt countries (e.g. Germany, France).
 * No application options — only the mandatory travel insurance offer.
 */
export default function ExemptLanding() {
  const params = useParams<{ countrySlug: string }>();
  const slug = params.countrySlug;
  const [country, setCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    fetch(`/api/travel/countries/${slug}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { setCountry(d.country ?? null); setLoading(false); })
      .catch(() => { setCountry(null); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f9' }}>
        <div className="text-gray-400 text-[14px]">Loading…</div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6" style={{ background: '#f4f6f9' }}>
        <p className="text-gray-500 text-[14px]">We couldn't find travel info for "{slug}".</p>
        <Link href="/" className="text-[14px] font-semibold" style={{ color: '#0a1f44' }}>← Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f9' }}>
      {/* ── Header ── */}
      <header className="px-4 py-3" style={{ background: '#0a1f44' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-bold text-[15px] leading-tight">
            Turkey<br /><span className="font-normal text-[12px] opacity-80">Travel Assistant</span>
          </Link>
          <Link href="/" className="text-[13px] text-white/80 hover:text-white font-medium">← Home</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-4 pb-16">
        {/* ── Title ── */}
        <div className="text-center">
          <div className="text-4xl mb-2">{country.flag_emoji}</div>
          <h1 className="font-black text-[28px] text-gray-900 leading-tight">{country.name} → Türkiye</h1>
          <div className="flex justify-center mt-3">
            <span
              className="px-3 py-1.5 rounded-full text-[13px] font-semibold"
              style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
            >
              ✅ {country.visa_summary || 'Permit-free entry'}
            </span>
          </div>
          {country.stay_rule && (
            <p className="text-gray-500 text-[14px] mt-3 leading-relaxed">{country.stay_rule}</p>
          )}
        </div>

        {/* ── Insurance card ── */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{ background: '#fff', border: '1px solid #e5e7eb' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🛡️</span>
            <h2 className="font-bold text-[17px] text-gray-900">
              {country.headline || 'Travel insurance is required for your stay'}
            </h2>
          </div>
          <p className="text-[13px] text-gray-600 mb-3 leading-relaxed">
            Travel health insurance is mandatory for the full duration of your stay.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {(country.features || []).map((f, i) => {
              const hasEmoji = /^\p{Extended_Pictographic}/u.test(f);
              return (
                <div key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
                  <span className="text-base shrink-0">{hasEmoji ? f.slice(0, 2) : '✅'}</span>
                  <span>{hasEmoji ? f.slice(2).trim() : f}</span>
                </div>
              );
            })}
          </div>
          {country.price_label && (
            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <div className="font-semibold text-[14px] text-gray-900">{country.price_label}</div>
              {country.price_example && (
                <div className="text-[12px] text-gray-500 mt-0.5">{country.price_example}</div>
              )}
            </div>
          )}
          <a
            href={country.cta_href || '/checkout'}
            className="block w-full text-center py-3 rounded-xl font-semibold text-[14px] text-white transition-colors"
            style={{ background: '#0a1f44' }}
          >
            {country.cta || 'Get travel insurance'}
          </a>
          <p className="text-center text-[11px] text-gray-400 mt-2">
            Instant PDF • Border-ready • Cancel anytime
          </p>
        </div>
      </main>
    </div>
  );
}
