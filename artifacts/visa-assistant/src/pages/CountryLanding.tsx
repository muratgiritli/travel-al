import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';

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

// ─── Static option data ───────────────────────────────────────────────────────

const SCHENGEN_TAGS = [
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czechia','Denmark','Estonia',
  'Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy',
  'Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Netherlands','Norway',
  'Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','Switzerland',
];
const OPTION1_TAGS = [
  ...SCHENGEN_TAGS, 'United Kingdom','United States','Canada','Australia','Japan','South Korea',
];
const OPTION2_TAGS = ['Schengen Area','United States','United Kingdom','Ireland'];
const GCC_TAGS    = ['UAE','Saudi Arabia','Qatar','Kuwait','Oman','Bahrain'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagGrid({ tags, max = 30 }: { tags: string[]; max?: number }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? tags : tags.slice(0, max);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
        {shown.map(t => (
          <span key={t} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: '#f0f4ff', color: '#1e3a8a' }}>{t}</span>
        ))}
      </div>
      {tags.length > max && (
        <button className="text-[12px] text-blue-600 underline mt-1" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `+ ${tags.length - max} more`}
        </button>
      )}
    </div>
  );
}

function InsuranceBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
      🛡️ Insurance required
    </span>
  );
}

function ApplyBtn({ href, label = 'APPLY NOW' }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-3 transition-opacity hover:opacity-90"
      style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}
    >
      {label}
    </a>
  );
}

function OptionCard({
  number, color, title, condition, price, children, applyHref,
}: {
  number: number; color: string; title: string; condition: string;
  price: string; children: React.ReactNode; applyHref: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
      {/* Colored header */}
      <div className="px-4 py-3" style={{ background: color }}>
        <div className="flex items-center justify-between">
          <span className="text-white text-[12px] font-bold tracking-wide uppercase opacity-80">Option {number}</span>
          <span className="text-white font-bold text-[15px]">{price}</span>
        </div>
        <div className="text-white font-bold text-[16px] mt-0.5">{title}</div>
      </div>
      {/* Body */}
      <div className="bg-white px-4 pt-3 pb-4">
        <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Condition</p>
        <p className="text-[13px] text-gray-700 mb-2">{condition}</p>
        {children}
        <div className="mt-3 mb-1"><InsuranceBadge /></div>
        <ApplyBtn href={applyHref} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CountryLanding() {
  const params = useParams<{ countrySlug: string }>();
  const [, navigate] = useLocation();
  const slug = params.countrySlug;

  const [country, setCountry] = useState<CountryData | null>(null);
  const [card, setCard] = useState<CardData | null>(null);
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

  const applyHref = `/apply/${country.id}`;
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
          <h1 className="font-black text-[28px] text-gray-900 leading-tight">Get Your e-Permit</h1>
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

        {/* ── Option 1 ── */}
        <OptionCard
          number={1}
          color="#1e3a8a"
          title="Get a Turkey e-Permit"
          condition="If you have a valid residence permit in any of the following countries:"
          price="$60 USD"
          applyHref={applyHref}
        >
          <p className="text-[13px] text-gray-600 mb-2">
            Hold a valid residence permit from a Schengen/EU country, UK, USA, Canada, Australia, Japan, or South Korea to qualify.
          </p>
          <TagGrid tags={OPTION1_TAGS} max={24} />
          <p className="text-[12px] text-gray-400 mt-2">
            e-Permit + travel info delivered by email. Delivery between 60 minutes and 7 days.
          </p>
        </OptionCard>

        {/* ── Option 2 ── */}
        <OptionCard
          number={2}
          color="#065f46"
          title="Get a Turkey e-Permit"
          condition="If you hold a valid entry permit for any of the following countries:"
          price="$60 USD"
          applyHref={applyHref}
        >
          <p className="text-[13px] text-gray-600 mb-2">
            Hold a valid physical entry permit from the Schengen Area, USA, UK, or Ireland — you may be eligible for an online e-Permit.
          </p>
          <TagGrid tags={OPTION2_TAGS} max={6} />
          <p className="text-[12px] text-gray-400 mt-2">
            e-Permit + travel info delivered by email. Delivery between 60 minutes and 7 days.
          </p>
        </OptionCard>

        {/* ── Option 3 ── */}
        <OptionCard
          number={3}
          color="#7c2d12"
          title="Get a Turkey Entry Permit"
          condition="If you have a valid residence permit in GCC countries:"
          price="$20 USD"
          applyHref={applyHref}
        >
          <p className="text-[13px] text-gray-600 mb-2">
            Residents of GCC countries may be eligible for a 30-day holiday entry stream to Türkiye.
          </p>
          <TagGrid tags={GCC_TAGS} max={8} />
        </OptionCard>

        {/* ── Option 4 ── */}
        <OptionCard
          number={4}
          color="#4c1d95"
          title="Sticker Permit Consultancy"
          condition="Embassy sticker permit consultancy service"
          price="$20 USD"
          applyHref={applyHref}
        >
          <ul className="flex flex-col gap-1.5 text-[13px] text-gray-600 mb-1">
            {[
              'Document preparation guidance',
              'Embassy appointment coordination',
              'Form & biometric support',
              'Application status tracking',
            ].map(b => (
              <li key={b} className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </OptionCard>

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

      {/* ── Floating AI Chat Button ── */}
      <button
        onClick={() => navigate('/')}
        className="fixed bottom-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-[13px] text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #c5a059, #a07830)' }}
        title="Chat with Turkey Travel Assistant"
      >
        🕌 Ask AI
      </button>
    </div>
  );
}
