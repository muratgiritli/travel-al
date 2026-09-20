import { useEffect, useMemo, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import OrderConfirm from '@/components/OrderConfirm';
import { submitOrder } from '@/lib/orders';
import { useI18n } from '@/lib/i18n';

const BTN = '#C73E54';
const BTN_DARK = '#A82E42';
const NAVY = '#0a1f44';

/** Pin element to the top of its nearest scrollable parent (chat column). */
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

type Traveler = {
  firstName: string;
  lastName: string;
  birthYear: string;
  passportNumber: string;
};

function emptyTraveler(): Traveler {
  return { firstName: '', lastName: '', birthYear: '', passportNumber: '' };
}

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  max,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-3 py-2.5 text-base sm:text-[14px] text-gray-900 outline-none"
        style={{ border: '1px solid #E5E7EB', background: '#F9FAFB' }}
      />
    </label>
  );
}

export default function InsuranceApplyForm({
  dailyPrice = 5,
  minDays = 1,
  currency = 'USD',
  onBack,
}: {
  dailyPrice?: number;
  minDays?: number;
  currency?: string;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelerCount, setTravelerCount] = useState(1);
  const [travelers, setTravelers] = useState<Traveler[]>([emptyTraveler()]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => scrollToTopOfScrollParent(rootRef.current), 40);
    return () => window.clearTimeout(t);
  }, [submitted]);

  const days = daysBetween(startDate, endDate);
  const total = dailyPrice * Math.max(days, 0) * travelerCount;

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    const list: number[] = [];
    for (let i = y - 16; i >= y - 100; i--) list.push(i);
    return list;
  }, []);

  const setCount = (n: number) => {
    const next = Math.min(6, Math.max(1, n));
    setTravelerCount(next);
    setTravelers((prev) => {
      if (next === prev.length) return prev;
      if (next > prev.length) {
        return [...prev, ...Array.from({ length: next - prev.length }, emptyTraveler)];
      }
      return prev.slice(0, next);
    });
  };

  const updateTraveler = (idx: number, patch: Partial<Traveler>) => {
    setTravelers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const valid = () => {
    if (!startDate || !endDate) return 'Select travel start and end dates.';
    if (days < (minDays || 1)) return `Coverage must be at least ${minDays || 1} day(s).`;
    for (let i = 0; i < travelers.length; i++) {
      const t = travelers[i];
      if (!t.firstName.trim() || !t.lastName.trim()) return `Enter full name for traveler ${i + 1}.`;
      if (!t.birthYear) return `Select birth year for traveler ${i + 1}.`;
      if (!t.passportNumber.trim()) return `Enter passport number for traveler ${i + 1}.`;
    }
    if (!phone.trim()) return 'Enter a mobile phone number.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    return '';
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = valid();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    const primary = travelers[0];
    return (
      <OrderConfirm
        amount={total}
        currency={currency}
        email={email}
        summary={`Travel insurance · ${travelerCount} traveler${travelerCount === 1 ? '' : 's'} · ${days} day${days === 1 ? '' : 's'}`}
        onBack={() => setSubmitted(false)}
        onSubmit={async () => {
          const order = await submitOrder({
            type: 'insurance',
            amount: total,
            currency,
            email,
            phone,
            customer_name: `${primary.firstName} ${primary.lastName}`.trim(),
            summary: `Insurance · ${days} days · ${travelerCount} traveler(s)`,
            payload: { startDate, endDate, days, travelers, dailyPrice },
          });
          return order.tracking_code;
        }}
      />
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
            {t('ins.regTitle')}
          </h2>
          <p className="text-[12px] text-gray-500 mt-1">
            {t('ins.regHint')}
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 text-[12px] font-semibold text-gray-500"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t('ins.travelStart')}
          type="date"
          value={startDate}
          min={today}
          onChange={(v) => {
            setStartDate(v);
            if (endDate && endDate < v) setEndDate(v);
          }}
        />
        <Field
          label={t('ins.travelEnd')}
          type="date"
          value={endDate}
          min={startDate || today}
          onChange={setEndDate}
        />
      </div>

      <div
        className="mt-3 rounded-xl px-3.5 py-3 flex items-center justify-between gap-3"
        style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
      >
        <span className="text-[13px] text-gray-600">{t('ins.totalDays')}</span>
        <span className="font-bold text-[15px]" style={{ color: NAVY }}>
          {days > 0 ? days : '—'}
        </span>
      </div>

      {/* Travelers count */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          {t('ins.travelers')}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCount(travelerCount - 1)}
            className="w-10 h-10 rounded-xl font-bold text-[18px] text-gray-700"
            style={{ border: '1px solid #E5E7EB', background: '#F9FAFB' }}
            aria-label="Fewer travelers"
          >
            −
          </button>
          <span className="font-bold text-[18px] min-w-[2ch] text-center" style={{ color: NAVY }}>
            {travelerCount}
          </span>
          <button
            type="button"
            onClick={() => setCount(travelerCount + 1)}
            className="w-10 h-10 rounded-xl font-bold text-[18px] text-gray-700"
            style={{ border: '1px solid #E5E7EB', background: '#F9FAFB' }}
            aria-label="More travelers"
          >
            +
          </button>
          <span className="text-[12px] text-gray-500">{t('ins.maxTravelers')}</span>
        </div>
      </div>

      {/* Price box */}
      <div
        className="mt-4 rounded-xl px-3.5 py-3.5"
        style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', border: '1px solid #FED7AA' }}
      >
        <div className="text-[12px] font-semibold text-gray-600">
          ${dailyPrice} × {days > 0 ? days : 0} day{days === 1 ? '' : 's'} × {travelerCount} traveler
          {travelerCount === 1 ? '' : 's'}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[12px] font-semibold text-gray-500">{currency}</span>
          <span className="font-bold text-[28px]" style={{ color: NAVY }}>
            {days > 0 ? total.toFixed(total % 1 ? 2 : 0) : '0'}
          </span>
        </div>
      </div>

      {/* Traveler fields */}
      <div className="mt-5 space-y-4">
        {travelers.map((trv, i) => (
          <div
            key={i}
            className="rounded-xl px-3 py-3.5"
            style={{ border: '1px solid #E5E7EB', background: '#FAFBFC' }}
          >
            <div className="text-[12px] font-bold text-gray-800 mb-3">
              {t('ins.travelerN', { n: i + 1 })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t('ins.firstName')}
                value={trv.firstName}
                onChange={(v) => updateTraveler(i, { firstName: v })}
                autoComplete="given-name"
              />
              <Field
                label={t('ins.lastName')}
                value={trv.lastName}
                onChange={(v) => updateTraveler(i, { lastName: v })}
                autoComplete="family-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <label className="block">
                <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {t('ins.birthYear')}
                </span>
                <select
                  value={trv.birthYear}
                  onChange={(e) => updateTraveler(i, { birthYear: e.target.value })}
                  className="w-full rounded-xl px-3 py-2.5 text-base sm:text-[14px] text-gray-900 outline-none"
                  style={{ border: '1px solid #E5E7EB', background: '#fff' }}
                >
                  <option value="">{t('ins.year')}</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label={t('ins.passportNo')}
                value={trv.passportNumber}
                onChange={(v) => updateTraveler(i, { passportNumber: v.toUpperCase() })}
                placeholder="A12345678"
                autoComplete="off"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-5">
        <div className="text-[12px] font-bold text-gray-800 mb-3">{t('entry.contact')}</div>
        <div className="space-y-3">
          <Field
            label={t('ins.mobile')}
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+90 5xx xxx xx xx"
            inputMode="tel"
            autoComplete="tel"
          />
          <Field
            label={t('ins.email')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            inputMode="email"
            autoComplete="email"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={days <= 0}
        className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-5 disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
      >
        {t('ins.continuePay')} · {currency} {days > 0 ? total.toFixed(total % 1 ? 2 : 0) : '0'}
      </button>
    </form>
    </div>
  );
}
