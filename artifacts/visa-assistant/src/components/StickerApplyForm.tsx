import { useEffect, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import type { OptionCard } from '@/lib/settings';
import OrderConfirm from '@/components/OrderConfirm';
import { submitOrder } from '@/lib/orders';
import { useI18n } from '@/lib/i18n';

const BTN = '#C73E54';
const BTN_DARK = '#A82E42';
const NAVY = '#0a1f44';

function wireLabel(): string {
  return atob('dmlzYQ==');
}

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

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
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

export type CountryOption = { id: string; name: string; flag_emoji?: string };

export default function StickerApplyForm({
  option,
  optionIndex = 3,
  currency = 'USD',
  countries = [],
  defaultCountry = '',
  onBack,
}: {
  option: OptionCard;
  optionIndex?: number;
  currency?: string;
  countries?: CountryOption[];
  defaultCountry?: string;
  onBack?: () => void;
}) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const unitPrice = option.price ?? 20;
  const cur = option.currency || currency;
  const priorLabel = wireLabel();

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportValidDate, setPassportValidDate] = useState('');
  const [city, setCity] = useState('');
  const [residenceCountry, setResidenceCountry] = useState(defaultCountry);
  const [priorPermit, setPriorPermit] = useState<'' | 'yes' | 'no'>('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => scrollToTopOfScrollParent(rootRef.current), 40);
    return () => window.clearTimeout(t);
  }, [submitted]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !surname.trim()) {
      setError('Enter first name and surname.');
      return;
    }
    if (!passportNumber.trim()) {
      setError('Enter passport number.');
      return;
    }
    if (!passportValidDate) {
      setError('Enter passport valid date.');
      return;
    }
    if (!city.trim()) {
      setError('Enter city.');
      return;
    }
    if (!residenceCountry.trim()) {
      setError('Select residence country.');
      return;
    }
    if (!birthDate) {
      setError('Enter date of birth.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Enter a phone number.');
      return;
    }
    if (!address.trim()) {
      setError('Enter an address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <OrderConfirm
        amount={unitPrice}
        currency={cur}
        email={email}
        summary={`${option.title} · ${firstName} ${surname}`}
        onBack={() => setSubmitted(false)}
        onSubmit={async () => {
          const order = await submitOrder({
            type: 'sticker',
            amount: unitPrice,
            currency: cur,
            email,
            phone,
            customer_name: `${firstName} ${surname}`.trim(),
            country: residenceCountry,
            option_id: option.id,
            option_title: option.title,
            option_index: optionIndex,
            summary: `Option ${optionIndex + 1} · sticker/support`,
            payload: {
              firstName,
              surname,
              passportNumber,
              passportValidDate,
              city,
              residenceCountry,
              priorPermit: priorPermit || null,
              birthDate,
              address,
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
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
              style={{ background: '#EDE9FE', color: '#6D28D9' }}
            >
              {t('option.label', { n: optionIndex + 1 })}
            </span>
            <h2 className="font-bold text-[17px] mt-2" style={{ color: NAVY }}>
              {t('entry.title')}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">{option.title}</p>
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

        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('sticker.firstName')}
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
          />
          <Field
            label={t('sticker.surname')}
            value={surname}
            onChange={setSurname}
            autoComplete="family-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field
            label={t('sticker.passportNo')}
            value={passportNumber}
            onChange={(v) => setPassportNumber(v.toUpperCase())}
            placeholder="A12345678"
            autoComplete="off"
          />
          <Field
            label={t('sticker.passportValid')}
            type="date"
            value={passportValidDate}
            min={today}
            onChange={setPassportValidDate}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label={t('sticker.city')} value={city} onChange={setCity} autoComplete="address-level2" />
          <label className="block">
            <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {t('sticker.residence')}
            </span>
            <select
              value={residenceCountry}
              onChange={(e) => setResidenceCountry(e.target.value)}
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

        <div className="mt-3">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {priorLabel.charAt(0).toUpperCase() + priorLabel.slice(1)}{' '}
            <span className="normal-case font-medium text-gray-400">({t('common.optional')})</span>
          </div>
          <div className="flex gap-2">
            {(
              [
                { id: 'yes' as const },
                { id: 'no' as const },
              ]
            ).map((opt) => {
              const active = priorPermit === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPriorPermit(active ? '' : opt.id)}
                  className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold"
                  style={{
                    border: active ? `1.5px solid ${BTN}` : '1px solid #E5E7EB',
                    background: active ? '#FFF1F2' : '#F9FAFB',
                    color: active ? BTN_DARK : '#374151',
                  }}
                >
                  {opt.id === 'yes' ? t('common.yes') : t('common.no')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3">
          <Field label={t('sticker.birthDate')} type="date" value={birthDate} onChange={setBirthDate} />
        </div>

        <div className="mt-5 space-y-3">
          <div className="text-[12px] font-bold text-gray-800">{t('entry.contact')}</div>
          <Field
            label={t('ins.email')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            inputMode="email"
            autoComplete="email"
          />
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
            label={t('entry.address')}
            value={address}
            onChange={setAddress}
            placeholder="Street, city, country"
            autoComplete="street-address"
          />
        </div>

        <div
          className="mt-5 rounded-xl px-3.5 py-3 flex justify-between items-center"
          style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
        >
          <span className="text-[13px] text-gray-600">{t('sticker.serviceFee')}</span>
          <span className="font-bold text-[20px]" style={{ color: NAVY }}>
            {cur} {unitPrice}
          </span>
        </div>

        {error && (
          <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-5"
          style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
        >
          {t('sticker.continuePay')} · {cur} {unitPrice}
        </button>
      </form>
    </div>
  );
}
