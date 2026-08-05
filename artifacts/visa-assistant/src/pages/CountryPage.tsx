import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import CountryLanding from './CountryLanding';
import AgeLanding from './AgeLanding';
import StickerLanding from './StickerLanding';
import ExemptLanding from './ExemptLanding';

/**
 * Thin dispatcher: fetches the country category, then renders
 * the correct layout component. Both landing pages do their own
 * full fetch so the data is never stale.
 */
export default function CountryPage() {
  const params = useParams<{ countrySlug: string }>();
  const slug = params.countrySlug;
  const [category, setCategory] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!slug) { setChecking(false); return; }
    fetch(`/api/travel/countries/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setCategory(d.country?.category ?? null); setChecking(false); })
      .catch(() => { setCategory(null); setChecking(false); });
  }, [slug]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f9' }}>
        <div className="text-gray-400 text-[14px]">Loading…</div>
      </div>
    );
  }

  if (category === 'age_special') return <AgeLanding />;
  if (category === 'sticker_mission') return <StickerLanding />;
  if (category === 'visa_exempt') return <ExemptLanding />;
  return <CountryLanding />;
}
