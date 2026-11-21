import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import type { EsimPlan } from '@/lib/settings';
import OrderConfirm from '@/components/OrderConfirm';
import { submitOrder } from '@/lib/orders';
import { useI18n } from '@/lib/i18n';

const ACCENT = '#7C3AED';
const ACCENT_DARK = '#6D28D9';
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

function formatPrice(price: number) {
  return Number.isInteger(price) ? String(price) : price.toFixed(2).replace(/\.00$/, '');
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
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

export type EsimCountryOption = { id: string; name: string; flag_emoji?: string };

export default function EsimApplyForm({
  plan,
  currency = 'USD',
  countries = [],
  defaultCountry = '',
  onBack,
}: {
  plan: EsimPlan;
  currency?: string;
  countries?: EsimCountryOption[];
  defaultCountry?: string;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(defaultCountry);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const cur = plan.currency || currency;
  const amount = formatPrice(plan.price);

  useEffect(() => {
    const t = window.setTimeout(() => scrollToTopOfScrollParent(rootRef.current), 40);
    return () => window.clearTimeout(t);
  }, [submitted]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Enter first and last name.');
      return;
    }
    if (!phone.trim()) {
      setError('Enter a phone number.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!country.trim()) {
      setError('Select your country.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <OrderConfirm
        amount={plan.price}
        currency={cur}
        email={email}
        summary={`eSIM · ${plan.name}`}
        onBack={() => setSubmitted(false)}
        onSubmit={async () => {
          const order = await submitOrder({
            type: 'esim',
            amount: plan.price,
            currency: cur,
            email,
            phone,
            customer_name: `${firstName} ${lastName}`.trim(),
            country,
            option_id: plan.id,
            option_title: plan.name,
            summary: `eSIM · ${plan.data_label} · ${plan.validity_days} days`,
            payload: {
              planId: plan.id,
              planName: plan.name,
              data_label: plan.data_label,
              validity_days: plan.validity_days,
              firstName,
              lastName,
            },
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
              {t('esim.orderTitle')}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              {plan.name} · {plan.data_label} · {plan.validity_days} days
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

        <div
          className="rounded-xl px-3.5 py-3 mb-5 flex items-center justify-between gap-3"
          style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}
        >
          <div className="text-[12px] text-gray-600">
            {plan.network} · {plan.coverage}
          </div>
          <div className="shrink-0 text-right leading-none">
            <span className="font-bold text-[22px]" style={{ color: NAVY }}>
              ${amount}
            </span>
            <span className="ml-1 text-[11px] font-semibold text-gray-400">{cur}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('esim.firstName')}
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
          />
          <Field
            label={t('esim.lastName')}
            value={lastName}
            onChange={setLastName}
            autoComplete="family-name"
          />
        </div>
        <div className="mt-3 space-y-3">
          <Field
            label={t('esim.phone')}
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+90 5xx xxx xx xx"
            inputMode="tel"
            autoComplete="tel"
          />
          <Field
            label={t('esim.email')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            inputMode="email"
            autoComplete="email"
          />
          <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {t('esim.country')}
            </span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-base sm:text-[14px] text-gray-900 outline-none"
              style={{ border: '1px solid #E5E7EB', background: '#fff' }}
            >
              <option value="">{t('common.selectCountry')}</option>
              {countries.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.flag_emoji ? `${c.flag_emoji} ` : ''}
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-5"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
        >
          {t('esim.submitPay')} · {cur} {amount}
        </button>
      </form>
    </div>
  );
}
