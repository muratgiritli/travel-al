import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
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

function onlyDigits(v: string) {
  return v.replace(/\D/g, '');
}

function formatCardNumber(v: string) {
  const d = onlyDigits(v).slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(v: string) {
  const d = onlyDigits(v).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
  autoComplete,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-[14px] text-gray-900 outline-none"
        style={{ border: '1px solid #E5E7EB', background: '#F9FAFB' }}
      />
    </label>
  );
}

export type PaymentMeta = { cardholder: string; last4: string };

/**
 * Payment UI shell only — no gateway / charge.
 * Wire a provider API here later; `onPay` currently persists the order for admin.
 */
export default function PaymentForm({
  amount,
  currency = 'USD',
  summary,
  onBack,
  onPay,
  onComplete,
}: {
  amount: number;
  currency?: string;
  summary?: string;
  onBack?: () => void;
  /** Save order / call gateway later — receives non-sensitive card meta only */
  onPay?: (meta: PaymentMeta) => Promise<string | void>;
  onComplete?: () => void;
}) {
  const { t } = useI18n();
  const [cardholder, setCardholder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const displayAmount = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.00$/, '');

  useEffect(() => {
    const t = window.setTimeout(() => scrollToTopOfScrollParent(rootRef.current), 40);
    return () => window.clearTimeout(t);
  }, [done]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cardholder.trim()) {
      setError(t('pay.err.cardholder'));
      return;
    }
    const digits = onlyDigits(cardNumber);
    if (digits.length < 13) {
      setError(t('pay.err.card'));
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError(t('pay.err.expiry'));
      return;
    }
    if (onlyDigits(cvc).length < 3) {
      setError(t('pay.err.cvc'));
      return;
    }
    setError('');
    setBusy(true);
    try {
      // Placeholder: connect payment provider API here later.
      const id = await onPay?.({ cardholder: cardholder.trim(), last4: digits.slice(-4) });
      if (id) setOrderId(id);
      setDone(true);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit payment form.');
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
          {t('pay.received')}
        </div>
        <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
          {t('pay.receivedBody')}
        </p>
        <div
          className="mt-4 rounded-xl px-3.5 py-3 text-[13px] flex justify-between"
          style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
        >
          <span className="text-gray-500">{t('pay.amountDue')}</span>
          <span className="font-bold" style={{ color: NAVY }}>
            {currency} {displayAmount}
          </span>
        </div>
        {orderId && (
          <p className="text-[11px] text-gray-400 mt-2 text-center">Ref: {orderId}</p>
        )}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 w-full text-center text-[13px] font-semibold text-gray-500 py-2"
          >
            ← {t('common.back')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <form
        onSubmit={submit}
        className="rounded-2xl px-4 py-5 bg-white"
        style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 10px rgba(15,23,42,.06)' }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-[17px]" style={{ color: NAVY }}>
              {t('pay.title')}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              {summary || t('pay.hint')}
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 text-[12px] font-semibold text-gray-500"
            >
              {t('common.back')}
            </button>
          )}
        </div>

        <div
          className="rounded-xl px-3.5 py-3 mb-5 flex justify-between items-center"
          style={{ background: '#FFF1F2', border: '1px solid #FECDD3' }}
        >
          <span className="text-[13px] font-semibold text-gray-700">{t('pay.amountDue')}</span>
          <span className="font-bold text-[22px]" style={{ color: NAVY }}>
            {currency} {displayAmount}
          </span>
        </div>

        <div className="space-y-3">
          <Field
            label={t('pay.cardholder')}
            value={cardholder}
            onChange={setCardholder}
            placeholder={t('pay.cardholder')}
            autoComplete="cc-name"
          />
          <Field
            label={t('pay.cardNumber')}
            value={cardNumber}
            onChange={(v) => setCardNumber(formatCardNumber(v))}
            placeholder="XXXX XXXX XXXX XXXX"
            inputMode="numeric"
            autoComplete="cc-number"
            maxLength={23}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t('pay.expiry')}
              value={expiry}
              onChange={(v) => setExpiry(formatExpiry(v))}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              maxLength={5}
            />
            <Field
              label={t('pay.cvc')}
              value={cvc}
              onChange={(v) => setCvc(onlyDigits(v).slice(0, 4))}
              placeholder="123"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-5 disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
        >
          {busy ? t('common.submitting') : t('pay.payBtn', { currency, amount: displayAmount })}
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed">
          {t('pay.previewNote')}
        </p>
      </form>
    </div>
  );
}
