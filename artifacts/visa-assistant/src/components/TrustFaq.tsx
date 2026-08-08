import { useMemo } from 'react';
import type { TrustSettings } from '@/lib/settings';

/** Compact trust lines only — FAQ lives in the footer link /faq page. */
export default function TrustFaq({ trust }: { trust: TrustSettings }) {
  const lines = useMemo(
    () =>
      [...(trust.trust_lines || [])]
        .filter((l) => l.active !== false)
        .sort((a, b) => a.sort - b.sort),
    [trust.trust_lines],
  );

  if (lines.length === 0) return null;

  return (
    <div className="px-1">
      <div className="text-center text-[11px] text-gray-400 leading-relaxed">
        {lines.map((l) => (
          <div key={l.id}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}
