import { useEffect, useState } from 'react';
import { getSummary, Summary, UnauthorizedError } from './api';
import { Card, categoryLabel, GOLD, NAVY } from './ui';
import { WIRE_CAT } from '@/lib/wireCodes';

const CATS = [
  WIRE_CAT.entryFree,
  WIRE_CAT.ePermitDirect,
  WIRE_CAT.ePermitConditional,
  WIRE_CAT.ageSpecial,
  WIRE_CAT.stickerMission,
];

const QUICK_LINKS: { tab: string; label: string; emoji: string }[] = [
  { tab: 'orders', label: 'Orders', emoji: '🧾' },
  { tab: 'countries', label: 'Countries', emoji: '🌍' },
  { tab: 'pricing', label: 'Pricing', emoji: '💲' },
  { tab: 'esim', label: 'eSIM Plans', emoji: '📶' },
  { tab: 'trust', label: 'Trust & FAQ', emoji: '🛡️' },
  { tab: 'knowledge', label: 'AI knowledge', emoji: '🧠' },
  { tab: 'content', label: 'Content', emoji: '📝' },
  { tab: 'chat', label: 'Chat messages', emoji: '💬' },
  { tab: 'apply', label: 'Apply', emoji: '📝' },
  { tab: 'brand', label: 'Brand', emoji: '🎨' },
  { tab: 'security', label: 'Security', emoji: '🔒' },
];

export default function Dashboard({
  onNavigate,
  onUnauthorized,
}: {
  onNavigate: (tab: string) => void;
  onUnauthorized: () => void;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else setError(err.message);
      });
  }, [onUnauthorized]);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Overview</h2>
        {error && <p className="text-red-500 text-[13px] mb-3">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Total countries" value={summary?.total ?? '—'} accent={NAVY} />
          <Stat label="Active" value={summary?.active ?? '—'} accent="#16a34a" />
          {CATS.map((cat) => (
            <Stat
              key={cat}
              label={categoryLabel(cat)}
              value={summary?.by_category?.[cat] ?? 0}
              accent={GOLD}
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Quick links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map((q) => (
            <button
              key={q.tab}
              onClick={() => onNavigate(q.tab)}
              className="text-left p-4 rounded-xl transition-colors hover:bg-gray-50"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <div className="text-2xl mb-1">{q.emoji}</div>
              <div className="font-semibold text-[14px] text-gray-900">{q.label}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="p-4 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #eef1f5' }}>
      <div className="text-2xl font-bold" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-[12px] text-gray-500 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}
