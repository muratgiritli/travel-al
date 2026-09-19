import { useState } from 'react';
import StaticPageShell from '@/components/StaticPageShell';
import { useSettings } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';
import { trackOrder, type TrackedOrder } from '@/lib/orders';

const STATUS_LABEL: Record<string, string> = {
  new: 'Received',
  paid: 'Paid',
  approved: 'Approved',
  processing: 'Processing',
  sent: 'Sent',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TrackPage() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    const trimmedEmail = email.trim();
    if (!trimmedCode || !trimmedEmail) {
      setError(t('track.needBoth'));
      setOrder(null);
      return;
    }
    setBusy(true);
    setError('');
    setOrder(null);
    try {
      setOrder(await trackOrder(trimmedCode, trimmedEmail));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('track.notFound'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StaticPageShell title="Track Application">
      <p className="mb-4">{settings.chat.track_text}</p>

      <form onSubmit={lookup} className="flex flex-col gap-3">
        <label className="block">
          <span className="block text-[12px] font-semibold text-gray-600 mb-1.5">
            {t('track.reference')}
          </span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="TEG-XXXXXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base sm:text-[14px] bg-gray-50 outline-none focus:border-gray-400"
          />
        </label>

        <label className="block">
          <span className="block text-[12px] font-semibold text-gray-600 mb-1.5">
            {t('track.email')}
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base sm:text-[14px] bg-gray-50 outline-none focus:border-gray-400"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[48px] font-bold text-white rounded-xl disabled:opacity-60"
          style={{ background: '#C73E54' }}
        >
          {busy ? t('track.searching') : t('track.submit')}
        </button>
      </form>

      {error && <p className="mt-4 text-[13px] text-red-600 leading-relaxed">{error}</p>}

      {order && (
        <div
          className="mt-5 rounded-xl px-4 py-4"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {t('confirm.reference')}
          </div>
          <div className="text-[18px] font-bold tracking-wide" style={{ color: '#0a1f44' }}>
            {order.tracking_code}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[13px] text-gray-500">{t('track.status')}</span>
            <span
              className="text-[13px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}
            >
              {STATUS_LABEL[order.status] || order.status}
            </span>
          </div>

          {order.summary && (
            <p className="mt-3 text-[13px] text-gray-600 leading-relaxed">{order.summary}</p>
          )}

          <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
            <span>{t('track.submittedOn')}</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[12px] text-gray-500">
            <span>{t('track.lastUpdate')}</span>
            <span>{formatDate(order.updated_at)}</span>
          </div>
        </div>
      )}
    </StaticPageShell>
  );
}
