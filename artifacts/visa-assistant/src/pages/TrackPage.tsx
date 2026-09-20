import { useMemo, useState } from 'react';
import StaticPageShell from '@/components/StaticPageShell';
import { useSettings } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';
import { startCheckout, trackOrder, type TrackedOrder } from '@/lib/orders';

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

function paidFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('paid') === '1';
}

export default function TrackPage() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const justPaid = useMemo(paidFromUrl, []);

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

  const pay = async () => {
    if (!order) return;
    setPaying(true);
    setError('');
    try {
      const url = await startCheckout(order.tracking_code, email.trim());
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('track.payError'));
      setPaying(false);
    }
  };

  const canPay =
    Boolean(settings.features.stripe_enabled)
    && order
    && order.amount > 0
    && (order.status === 'new' || order.status === 'approved');

  return (
    <StaticPageShell title="Track Application">
      <p className="mb-4">{settings.chat.track_text}</p>

      {justPaid && (
        <p
          className="mb-4 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
          style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46' }}
        >
          {t('track.paidThanks')}
        </p>
      )}

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

          {order.amount > 0 && (
            <div className="mt-3 flex items-center justify-between text-[13px]">
              <span className="text-gray-500">{t('track.amount')}</span>
              <span className="font-semibold" style={{ color: '#0a1f44' }}>
                {order.currency} {order.amount}
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-[12px] text-gray-500">
            <span>{t('track.submittedOn')}</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[12px] text-gray-500">
            <span>{t('track.lastUpdate')}</span>
            <span>{formatDate(order.updated_at)}</span>
          </div>

          {order.history.length > 0 && (
            <ol className="mt-4 space-y-1.5 border-t border-gray-200 pt-3">
              <li className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {t('track.history')}
              </li>
              {order.history.map((h, i) => (
                <li key={`${h.status}-${h.at}-${i}`} className="flex justify-between text-[12px] text-gray-600">
                  <span>{STATUS_LABEL[h.status] || h.status}</span>
                  <span className="text-gray-400">{formatDate(h.at)}</span>
                </li>
              ))}
            </ol>
          )}

          {canPay && (
            <button
              type="button"
              onClick={pay}
              disabled={paying}
              className="mt-4 w-full min-h-[48px] font-bold text-white rounded-xl disabled:opacity-60"
              style={{ background: '#0a1f44' }}
            >
              {paying ? t('track.paying') : t('track.pay')}
            </button>
          )}
        </div>
      )}
    </StaticPageShell>
  );
}
