import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

const BTN = '#C73E54';
const BTN_DARK = '#A82E42';
const NAVY = '#0a1f44';

function scrollToTopOfScrollParent(el: HTMLElement | null) {
  if (!el) return;
  let p: HTMLElement | null = el.parentElement;
  while (p) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === 'auto' || overflowY === 'scroll') && p.scrollHeight > p.clientHeight + 1) {
      const pRect = p.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      p.scrollTo({
        top: Math.max(0, p.scrollTop + (elRect.top - pRect.top) - 8),
        behavior: 'smooth',
      });
      return;
    }
    p = p.parentElement;
  }
  el.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/**
 * Final step of an application: review the total and submit.
 *
 * No card details are collected. Taking card numbers in this form would put
 * the site in PCI scope while no payment provider is connected and nothing is
 * actually charged, so payment is arranged after the application is reviewed.
 */
export default function OrderConfirm({
  amount,
  currency = 'USD',
  summary,
  email,
  onBack,
  onSubmit,
  onComplete,
}: {
  amount: number;
  currency?: string;
  summary?: string;
  /** Shown on the receipt so the applicant can check it before leaving. */
  email?: string;
  onBack?: () => void;
  /** Records the application; resolves with its tracking reference. */
  onSubmit?: () => Promise<string | void>;
  onComplete?: () => void;
}) {
  const { t } = useI18n();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [reference, setReference] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const displayAmount = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.00$/, '');

  useEffect(() => {
    const timer = window.setTimeout(() => scrollToTopOfScrollParent(rootRef.current), 40);
    return () => window.clearTimeout(timer);
  }, [done]);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const ref = await onSubmit?.();
      if (ref) setReference(ref);
      setDone(true);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('confirm.err.generic'));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div
        ref={rootRef}
        className="rounded-2xl px-4 py-5 bg-white"
        style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 10px rgba(15,23,42,.06)' }}
      >
        <div className="font-bold text-[17px]" style={{ color: NAVY }}>
          {t('confirm.received')}
        </div>
        <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
          {t('confirm.receivedBody')}
        </p>

        {reference && (
          <div
            className="mt-4 rounded-xl px-3.5 py-3"
            style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {t('confirm.reference')}
            </div>
            <div className="text-[18px] font-bold tracking-wide mt-0.5" style={{ color: NAVY }}>
              {reference}
            </div>
            {email && (
              <div className="text-[12px] text-gray-500 mt-2 break-all">{email}</div>
            )}
          </div>
        )}

        <div
          className="mt-3 rounded-xl px-3.5 py-3 text-[13px] flex justify-between"
          style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
        >
          <span className="text-gray-500">{t('confirm.total')}</span>
          <span className="font-bold" style={{ color: NAVY }}>
            {currency} {displayAmount}
          </span>
        </div>

        <p className="text-[12px] text-gray-500 mt-3 leading-relaxed">
          {t('confirm.nextSteps')}
        </p>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 w-full min-h-[44px] text-center text-[13px] font-semibold text-gray-500"
          >
            ← {t('common.back')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <div
        className="rounded-2xl px-4 py-5 bg-white"
        style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 10px rgba(15,23,42,.06)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-[17px]" style={{ color: NAVY }}>
              {t('confirm.title')}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">{summary || t('confirm.hint')}</p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 min-h-[44px] text-[12px] font-semibold text-gray-500"
            >
              {t('common.back')}
            </button>
          )}
        </div>

        <div
          className="rounded-xl px-3.5 py-3 text-[14px] flex justify-between items-center"
          style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
        >
          <span className="text-gray-500">{t('confirm.total')}</span>
          <span className="font-bold text-[16px]" style={{ color: NAVY }}>
            {currency} {displayAmount}
          </span>
        </div>

        {email && (
          <p className="text-[12px] text-gray-500 mt-3 break-all">
            {t('confirm.sendTo', { email })}
          </p>
        )}

        <div
          className="mt-3 rounded-xl px-3.5 py-3 text-[12px] leading-relaxed"
          style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412' }}
        >
          {t('confirm.paymentNote')}
        </div>

        {error && <p className="text-[13px] text-red-600 mt-3">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="w-full min-h-[48px] mt-4 rounded-xl text-white font-bold text-[15px] disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
        >
          {busy ? t('confirm.submitting') : t('confirm.submit')}
        </button>
      </div>
    </div>
  );
}
