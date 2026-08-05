import AskAIDrawer from '../components/AskAIDrawer';
import OptionCards from '../components/OptionCards';
import type { OptionCard } from '@/lib/settings';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'wouter';

interface CountryData {
  id: string; name: string; iso2: string; flag_emoji: string;
  visa_summary: string; stay_rule: string; category: string;
  precondition?: string;
}
interface CardData {
  visa_status: string; headline: string; body: string[];
  features: string[]; cta: string; cta_href: string;
  admin_html_notes: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CountryLanding() {
  const params = useParams<{ countrySlug: string }>();
  const slug = params.countrySlug;

  const [country, setCountry] = useState<CountryData | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [optionCards, setOptionCards] = useState<OptionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/travel/countries/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(d => {
        setCountry(d.country);
        setCard(d.card);
        setOptionCards(d.option_cards ?? []);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f9' }}>
        <div className="text-gray-400 text-[14px]">Loading…</div>
      </div>
    );
  }

  if (notFound || !country) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: '#f4f6f9' }}>
        <div className="text-5xl">🕌</div>
        <h1 className="font-bold text-xl text-gray-900">Country not found</h1>
        <p className="text-gray-500 text-[14px]">We couldn't find travel info for "{slug}".</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl text-white font-semibold text-[14px]" style={{ background: '#0a1f44' }}>
          ← Back to country picker
        </Link>
      </div>
    );
  }

  // Parse stay length from card body or country data
  const stayLine = card?.body?.[0] || country.stay_rule || '';
  const stayMatch = stayLine.match(/(\d+)[- ]day/i);
  const stayDays = stayMatch ? `${stayMatch[1]} Days` : '30 Days';
  const entryType = stayLine.toLowerCase().includes('multiple') ? 'Multiple Entry' : 'Single Entry';

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* ── Sticky Header ── */}
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: '#0a1f44', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}
      >
        <Link href="/" className="flex items-center gap-2 flex-1">
          <div
            className="flex items-center justify-center text-lg shrink-0"
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)' }}
          >
            🕌
          </div>
          <span className="text-white font-bold text-[15px] leading-tight">Turkey<br /><span className="font-normal text-[12px] opacity-80">Travel Assistant</span></span>
        </Link>
        <nav className="flex items-center gap-3">
          <a href="/faq" className="text-white text-[12px] opacity-70 hover:opacity-100">FAQ</a>
          <a href="/track" className="text-white text-[12px] opacity-70 hover:opacity-100">Track</a>
        </nav>
      </header>

      <div className="max-w-[480px] mx-auto px-4 pb-24">
        {/* ── Hero ── */}
        <div className="text-center py-8">
          {/* Country pills */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-white"
              style={{ background: '#c5a059' }}
            >
              🇹🇷 TURKEY
            </span>
            <span className="text-gray-400 font-bold">+</span>
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-white"
              style={{ background: '#0a1f44' }}
            >
              {country.flag_emoji} {country.name.toUpperCase()}
            </span>
          </div>
          <h1 className="font-black text-[28px] text-gray-900 leading-tight">Get Your Travel Authorization</h1>
          <h2 className="font-semibold text-[17px] text-gray-600 mt-1">for {country.name} Citizens</h2>
          <p className="text-[13px] text-gray-500 mt-2 max-w-xs mx-auto">
            {country.precondition || card?.headline || 'Conditional e-Permit — eligibility conditions apply.'}
          </p>
        </div>

        {/* ── Travel Requirements Card ── */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}
        >
          <h3 className="font-bold text-[15px] text-gray-900 mb-3">
            Travel Requirements for Turkey (2026):
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-500 flex items-center gap-2">🛂 Passport validity</span>
              <span className="font-semibold text-gray-800">Minimum 180 days</span>
            </div>
            <div style={{ height: 1, background: '#f0f0f0' }} />
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-500 flex items-center gap-2">📅 Maximum stay</span>
              <span className="font-semibold text-gray-800">{stayDays}, {entryType}</span>
            </div>
            <div style={{ height: 1, background: '#f0f0f0' }} />
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-500 flex items-center gap-2">🛡️ Insurance</span>
              <span className="font-semibold text-[#c2410c]">Required</span>
            </div>
          </div>
        </div>

        {/* ── Admin-editable option cards ── */}
        <OptionCards cards={optionCards} />

        {/* Admin notes */}
        {card?.admin_html_notes && (
          <div
            className="mt-2 mb-4 p-4 rounded-xl text-[13px] text-gray-600"
            style={{ background: '#fff', border: '1px solid #e5e7eb' }}
            dangerouslySetInnerHTML={{ __html: card.admin_html_notes }}
          />
        )}
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{ background: '#fff', borderTop: '1px solid #e5e7eb', height: 60 }}
      >
        {[
          { icon: '🏠', label: 'Home', href: '/' },
          { icon: '📦', label: 'Track', href: '/track' },
          { icon: '❓', label: 'FAQ', href: '/faq' },
          { icon: '📞', label: 'Contact', href: '/contact' },
        ].map(tab => (
          <a
            key={tab.label}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-gray-900"
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </a>
        ))}
      </div>

      {/* ── AI Chat bottom sheet ── */}
      <AskAIDrawer countryId={country.id} countryName={country.name} />
    </div>
  );
}
