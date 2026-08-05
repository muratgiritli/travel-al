import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';

interface AgeBand { label: string; status: string; detail: string; }
interface CountryData {
  id: string; name: string; iso2: string; flag_emoji: string; slug?: string;
  visa_summary: string; stay_rule: string; category: string;
  precondition?: string; age_bands?: AgeBand[]; ai_extra_context?: string;
}

// ─── Shared sub-components (same palette as CountryLanding) ───────────────────

function InsuranceBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
      🛡️ Insurance required
    </span>
  );
}

function ApplyBtn({ href }: { href: string }) {
  return (
    <a href={href}
      className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-3 transition-opacity hover:opacity-90"
      style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}>
      APPLY NOW
    </a>
  );
}

const SCHENGEN_TAGS = [
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czechia','Denmark','Estonia',
  'Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy',
  'Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Netherlands','Norway',
  'Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden','Switzerland',
];
const OPTION1_TAGS = [...SCHENGEN_TAGS, 'United Kingdom','United States','Canada','Australia','Japan','South Korea'];
const OPTION2_TAGS = ['Schengen Area','United States','United Kingdom','Ireland'];
const GCC_TAGS = ['UAE','Saudi Arabia','Qatar','Kuwait','Oman','Bahrain'];
const AIRLINE_TAGS = ['Turkish Airlines','AJet','Pegasus','EgyptAir','Air Cairo'];

function TagPill({ tag, color = '#f0f4ff', text = '#1e3a8a' }: { tag: string; color?: string; text?: string }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: color, color: text }}>{tag}</span>
  );
}

function TagGrid({ tags, max = 30, color, text }: { tags: string[]; max?: number; color?: string; text?: string }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? tags : tags.slice(0, max);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
        {shown.map(t => <TagPill key={t} tag={t} color={color} text={text} />)}
      </div>
      {tags.length > max && (
        <button className="text-[12px] text-blue-600 underline mt-1"
          onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : `+ ${tags.length - max} more`}
        </button>
      )}
    </div>
  );
}

// ─── Age Band Card ────────────────────────────────────────────────────────────

function AgeBandCard({ band, applyHref, countryName, isEgypt }: {
  band: AgeBand; applyHref: string; countryName: string; isEgypt?: boolean;
}) {
  const isExempt = band.status === 'visa_exempt';
  const isDirect = band.status === 'direct_evisa';

  const headerColor = isExempt ? '#065f46' : isDirect ? '#1e3a8a' : '#7c2d12';
  const badgeText = isExempt ? '✅ Permit-Free' : isDirect ? '🔵 Direct e-Permit' : '⚠️ Conditional e-Permit';

  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ background: headerColor }}>
        <div className="flex items-center justify-between">
          <span className="text-white text-[12px] font-bold tracking-wide uppercase opacity-80">
            {band.label}
          </span>
          <span className="text-white text-[12px] font-semibold opacity-90">{badgeText}</span>
        </div>
      </div>
      {/* Body */}
      <div className="bg-white px-4 pt-3 pb-4">
        <p className="text-[13px] text-gray-700 mb-2">{band.detail}</p>

        {/* Egypt ages 15–45: airline condition */}
        {isEgypt && !isExempt && !isDirect && (
          <div className="mb-2">
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Also required: fly with one of these airlines
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AIRLINE_TAGS.map(t => <TagPill key={t} tag={t} color="#fff7ed" text="#92400e" />)}
            </div>
          </div>
        )}

        <div className="mt-2 mb-1"><InsuranceBadge /></div>
        {isExempt ? (
          <div className="mt-2 text-center text-[12px] text-green-700 font-medium py-2 rounded-xl"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            No application needed — travel freely 🎉
          </div>
        ) : (
          <ApplyBtn href={applyHref} />
        )}
      </div>
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────

function OptionCard({ number, color, title, condition, price, children, applyHref }: {
  number: number; color: string; title: string; condition: string;
  price: string; children: React.ReactNode; applyHref: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
      <div className="px-4 py-3" style={{ background: color }}>
        <div className="flex items-center justify-between">
          <span className="text-white text-[12px] font-bold tracking-wide uppercase opacity-80">Option {number}</span>
          <span className="text-white font-bold text-[15px]">{price}</span>
        </div>
        <div className="text-white font-bold text-[16px] mt-0.5">{title}</div>
      </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgeLanding() {
  const params = useParams<{ countrySlug: string }>();
  const [, navigate] = useLocation();
  const slug = params.countrySlug;

  const [country, setCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setNotFound(false);
    fetch(`/api/travel/countries/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setCountry(d.country); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f9' }}>
      <div className="text-gray-400 text-[14px]">Loading…</div>
    </div>
  );

  if (notFound || !country) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: '#f4f6f9' }}>
      <div className="text-5xl">🕌</div>
      <h1 className="font-bold text-xl text-gray-900">Country not found</h1>
      <Link href="/" className="px-5 py-2.5 rounded-xl text-white font-semibold text-[14px]"
        style={{ background: '#0a1f44' }}>← Back</Link>
    </div>
  );

  const applyHref = `/apply/${country.slug || country.id}`;
  const ageBands = country.age_bands || [];
  const isEgypt = (country.slug || country.id) === 'egypt' || country.iso2 === 'EG';

  // Parse stay info
  const stayMatch = (country.stay_rule || '').match(/(\d+)[- ]day/i);
  const stayDays = stayMatch ? `${stayMatch[1]} Days` : '30 Days';
  const entryType = (country.stay_rule || '').toLowerCase().includes('multiple') ? 'Multiple Entry' : 'Single Entry';

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: '#0a1f44', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
        <Link href="/" className="flex items-center gap-2 flex-1">
          <div className="flex items-center justify-center text-lg shrink-0"
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)' }}>
            🕌
          </div>
          <span className="text-white font-bold text-[15px] leading-tight">
            Turkey<br /><span className="font-normal text-[12px] opacity-80">Travel Assistant</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <a href="/faq" className="text-white text-[12px] opacity-70 hover:opacity-100">FAQ</a>
          <a href="/track" className="text-white text-[12px] opacity-70 hover:opacity-100">Track</a>
        </nav>
      </header>

      <div className="max-w-[480px] mx-auto px-4 pb-24">
        {/* ── Hero ── */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-white"
              style={{ background: '#c5a059' }}>🇹🇷 TURKEY</span>
            <span className="text-gray-400 font-bold">+</span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-white"
              style={{ background: '#0a1f44' }}>
              {country.flag_emoji} {country.name.toUpperCase()}
            </span>
          </div>
          <h1 className="font-black text-[28px] text-gray-900 leading-tight">Get Your e-Permit</h1>
          <h2 className="font-semibold text-[17px] text-gray-600 mt-1">for {country.name} Citizens</h2>
          <p className="text-[13px] text-gray-500 mt-2 max-w-xs mx-auto">
            Age-based rules apply — choose your category below.
          </p>
        </div>

        {/* ── Travel Requirements ── */}
        <div className="rounded-2xl p-4 mb-5"
          style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
          <h3 className="font-bold text-[15px] text-gray-900 mb-3">
            Travel Requirements for Turkey (2026):
          </h3>
          <div className="flex flex-col gap-2">
            {[
              { icon: '🛂', label: 'Passport validity', value: 'Minimum 180 days' },
              { icon: '📅', label: 'Maximum stay', value: `${stayDays}, ${entryType}` },
              { icon: '🛡️', label: 'Insurance', value: 'Required', red: true },
            ].map(r => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-gray-500">{r.icon} {r.label}</span>
                  <span className={`font-semibold ${r.red ? 'text-[#c2410c]' : 'text-gray-800'}`}>{r.value}</span>
                </div>
                <div style={{ height: 1, background: '#f0f0f0', marginTop: 6 }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Age Pathways ── */}
        {ageBands.length > 0 && (
          <>
            <h3 className="font-bold text-[16px] text-gray-900 mb-3">Choose Your Category</h3>
            {ageBands.map((band, i) => (
              <AgeBandCard key={i} band={band} applyHref={applyHref} countryName={country.name} isEgypt={isEgypt} />
            ))}
          </>
        )}

        {/* ── Standard Options (conditional / support) ── */}
        <div className="mt-2">
          <h3 className="font-bold text-[15px] text-gray-900 mb-3">Additional Pathways</h3>

          <OptionCard number={1} color="#1e3a8a"
            title="Get a Turkey e-Permit"
            condition="If you have a valid residence permit in any of the following countries:"
            price="$60 USD" applyHref={applyHref}>
            <TagGrid tags={OPTION1_TAGS} max={24} />
            <p className="text-[12px] text-gray-400 mt-2">
              e-Permit + travel info delivered by email. Delivery between 60 minutes and 7 days.
            </p>
          </OptionCard>

          <OptionCard number={2} color="#065f46"
            title="Get a Turkey e-Permit"
            condition="If you hold a valid entry permit for any of the following countries:"
            price="$60 USD" applyHref={applyHref}>
            <TagGrid tags={OPTION2_TAGS} max={6} />
            <p className="text-[12px] text-gray-400 mt-2">
              Valid physical entry permit from the Schengen Area, USA, UK or Ireland required.
            </p>
          </OptionCard>

          <OptionCard number={3} color="#7c2d12"
            title="Get a Turkey Entry Permit"
            condition="If you have a valid residence permit in GCC countries:"
            price="$20 USD" applyHref={applyHref}>
            <TagGrid tags={GCC_TAGS} max={8} />
          </OptionCard>

          <OptionCard number={4} color="#4c1d95"
            title="Sticker Permit Consultancy"
            condition="Embassy sticker permit consultancy service"
            price="$20 USD" applyHref={applyHref}>
            <ul className="flex flex-col gap-1.5 text-[13px] text-gray-600">
              {['Document preparation guidance','Embassy appointment coordination',
                'Form & biometric support','Application status tracking'].map(b => (
                <li key={b} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span><span>{b}</span>
                </li>
              ))}
            </ul>
          </OptionCard>
        </div>
      </div>

      {/* ── Bottom Tab Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{ background: '#fff', borderTop: '1px solid #e5e7eb', height: 60 }}>
        {[
          { icon: '🏠', label: 'Home', href: '/' },
          { icon: '📦', label: 'Track', href: '/track' },
          { icon: '❓', label: 'FAQ', href: '/faq' },
          { icon: '📞', label: 'Contact', href: '/contact' },
        ].map(tab => (
          <a key={tab.label} href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-gray-900">
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </a>
        ))}
      </div>

      {/* ── Floating AI Button ── */}
      <button onClick={() => navigate('/')}
        className="fixed bottom-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-[13px] text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #c5a059, #a07830)' }}>
        🕌 Ask AI
      </button>
    </div>
  );
}
