import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';

interface CountryData {
  id: string; name: string; iso2: string; flag_emoji: string; slug?: string;
  visa_summary: string; stay_rule: string; mission_note?: string; category: string;
  admin_html_notes?: string;
}

function InsuranceBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
      🛡️ Insurance required
    </span>
  );
}

function ApplyBtn({ href, label = 'APPLY NOW' }: { href: string; label?: string }) {
  return (
    <a href={href}
      className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-4 transition-opacity hover:opacity-90"
      style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}>
      {label}
    </a>
  );
}

export default function StickerLanding() {
  const params = useParams<{ countrySlug: string }>();
  const [, navigate] = useLocation();
  const slug = params.countrySlug;

  const [country, setCountry] = useState<CountryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setNotFound(false);
    fetch(`/api/visa/countries/${slug}`)
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
  const missionNote = country.mission_note || country.stay_rule || 'Embassy/consulate sticker visa required.';

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3"
        style={{ background: '#0a1f44', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
        <Link href="/" className="flex items-center gap-2 flex-1">
          <div className="flex items-center justify-center text-lg shrink-0"
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)' }}>
            🕌
          </div>
          <span className="text-white font-bold text-[15px] leading-tight">
            Turkey<br /><span className="font-normal text-[12px] opacity-80">Visa Office</span>
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
          <h1 className="font-black text-[28px] text-gray-900 leading-tight">Embassy Sticker Visa</h1>
          <h2 className="font-semibold text-[17px] text-gray-600 mt-1">for {country.name} Citizens</h2>
        </div>

        {/* ── No e-Visa notice ── */}
        <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
          style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
          <span className="text-2xl shrink-0 mt-0.5">ℹ️</span>
          <div>
            <p className="font-semibold text-[14px] text-amber-900">No online e-Visa for {country.name} passports</p>
            <p className="text-[13px] text-amber-800 mt-1">
              {country.name} ordinary passport holders cannot apply for a Turkish e-Visa online.
              A sticker visa issued by a Turkish embassy or consulate is required.
              We can guide you through the full process.
            </p>
          </div>
        </div>

        {/* ── Requirements Card ── */}
        <div className="rounded-2xl p-4 mb-5"
          style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
          <h3 className="font-bold text-[15px] text-gray-900 mb-3">Travel Requirements for Turkey (2026):</h3>
          <div className="flex flex-col gap-2">
            {[
              { icon: '🛂', label: 'Passport validity', value: 'Minimum 180 days' },
              { icon: '📋', label: 'Visa type', value: 'Embassy sticker visa' },
              { icon: '📌', label: 'Official note', value: missionNote },
              { icon: '🛡️', label: 'Insurance', value: 'Required', red: true },
            ].map((r, i) => (
              <div key={i}>
                <div className="flex items-start justify-between text-[13px] gap-3">
                  <span className="text-gray-500 shrink-0">{r.icon} {r.label}</span>
                  <span className={`font-semibold text-right ${r.red ? 'text-[#c2410c]' : 'text-gray-800'}`}>{r.value}</span>
                </div>
                {i < 3 && <div style={{ height: 1, background: '#f0f0f0', marginTop: 8 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Primary Service Card ── */}
        <div className="rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          {/* Card header */}
          <div className="px-4 py-3" style={{ background: '#4c1d95' }}>
            <div className="flex items-center justify-between">
              <span className="text-white text-[12px] font-bold tracking-wide uppercase opacity-80">Recommended</span>
              <span className="text-white font-bold text-[15px]">$20 USD</span>
            </div>
            <div className="text-white font-bold text-[17px] mt-0.5">Sticker Visa Consultancy Service</div>
          </div>
          {/* Card body */}
          <div className="bg-white px-4 pt-4 pb-4">
            <p className="text-[13px] text-gray-600 mb-3">
              Our team handles the full embassy application process for you —
              from document preparation to submission tracking.
            </p>
            <ul className="flex flex-col gap-2 mb-3">
              {[
                { icon: '📄', text: 'Full document preparation & checklist' },
                { icon: '🏛️', text: 'Consular appointment booking assistance' },
                { icon: '📝', text: 'Form completion & biometric support' },
                { icon: '📡', text: '24/7 application status tracking' },
              ].map(b => (
                <li key={b.text} className="flex items-center gap-2 text-[13px] text-gray-700">
                  <span className="text-[16px] shrink-0">{b.icon}</span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
            <InsuranceBadge />
            <ApplyBtn href={applyHref} />
          </div>
        </div>

        {/* ── GCC Resident bonus card ── */}
        <div className="rounded-2xl overflow-hidden mb-4"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          <div className="px-4 py-3" style={{ background: '#7c2d12' }}>
            <div className="flex items-center justify-between">
              <span className="text-white text-[12px] font-bold tracking-wide uppercase opacity-80">GCC Residents</span>
              <span className="text-white font-bold text-[15px]">$20 USD</span>
            </div>
            <div className="text-white font-bold text-[16px] mt-0.5">Holiday Visa — GCC Residence</div>
          </div>
          <div className="bg-white px-4 pt-3 pb-4">
            <p className="text-[13px] text-gray-600 mb-2">
              If you hold a valid residence permit in the UAE, Saudi Arabia, Qatar, Kuwait, Oman, or Bahrain,
              you may qualify for a simplified 30-day holiday visa stream.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['UAE','Saudi Arabia','Qatar','Kuwait','Oman','Bahrain'].map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: '#fff7ed', color: '#92400e' }}>{t}</span>
              ))}
            </div>
            <InsuranceBadge />
            <ApplyBtn href={applyHref} />
          </div>
        </div>

        {/* Admin notes */}
        {country.admin_html_notes && (
          <div className="mt-2 mb-4 p-4 rounded-xl text-[13px] text-gray-600"
            style={{ background: '#fff', border: '1px solid #e5e7eb' }}
            dangerouslySetInnerHTML={{ __html: country.admin_html_notes }} />
        )}
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
