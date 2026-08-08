import { useEffect, useMemo, useRef, useState, type FormEvent, type HTMLAttributes } from 'react';
import type { OptionCard } from '@/lib/settings';
import PaymentForm from '@/components/PaymentForm';
import { submitOrder } from '@/lib/orders';
import { useI18n } from '@/lib/i18n';

const BTN = '#C73E54';
const BTN_DARK = '#A82E42';
const NAVY = '#0a1f44';
const VALIDITY_DAYS = 180;
const MAX_STAY_DAYS = 30;

function ePermitLabel(): string {
  return 'e-' + atob('dmlzYQ==');
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

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0;
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatLongDate(iso: string, locale = 'en'): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  const loc =
    locale === 'ar' ? 'ar' :
    locale === 'tr' ? 'tr-TR' :
    locale === 'de' ? 'de-DE' :
    locale === 'es' ? 'es-ES' :
    locale === 'fr' ? 'fr-FR' :
    locale === 'ru' ? 'ru-RU' : 'en-GB';
  return d.toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' });
}

const DEFAULT_SUPPORT_COUNTRIES = [
  'Austria', 'Belgium', 'Czechia', 'Denmark', 'Estonia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Norway', 'Poland',
  'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
  'United States', 'United Kingdom', 'Ireland',
];

/** Supporting-doc country list = this option card's eligible tags (as shown on the card). */
function countriesFromTags(tags?: string[]): string[] {
  if (!tags?.length) return DEFAULT_SUPPORT_COUNTRIES;
  const parsed = tags
    .map((t) => {
      const m = t.trim().match(/^([A-Z]{2,3})\s+(.+)$/);
      return (m ? m[2] : t).trim();
    })
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_SUPPORT_COUNTRIES;
}

type Applicant = {
  firstName: string;
  surname: string;
  dateOfBirth: string;
  placeOfBirth: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  supportingDocFrom: string;
  supportingDocNo: string;
  supportingDocExpiry: string;
};

function emptyApplicant(): Applicant {
  return {
    firstName: '',
    surname: '',
    dateOfBirth: '',
    placeOfBirth: '',
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    supportingDocFrom: '',
    supportingDocNo: '',
    supportingDocExpiry: '',
  };
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
        className="w-full rounded-xl px-3 py-2.5 text-[14px] text-gray-900 outline-none"
        style={{ border: '1px solid #E5E7EB', background: '#F9FAFB' }}
      />
    </label>
  );
}

function ApplicantFields({
  title,
  value,
  onChange,
  supportCountries,
  t,
}: {
  title: string;
  value: Applicant;
  onChange: (patch: Partial<Applicant>) => void;
  supportCountries: string[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <div
      className="rounded-xl px-3 py-3.5"
      style={{ border: '1px solid #E5E7EB', background: '#FAFBFC' }}
    >
      <div className="text-[12px] font-bold text-gray-800 mb-3">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t('entry.firstName')}
          value={value.firstName}
          onChange={(v) => onChange({ firstName: v })}
          autoComplete="given-name"
        />
        <Field
          label={t('entry.surname')}
          value={value.surname}
          onChange={(v) => onChange({ surname: v })}
          autoComplete="family-name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field
          label={t('entry.dob')}
          type="date"
          value={value.dateOfBirth}
          onChange={(v) => onChange({ dateOfBirth: v })}
        />
        <Field
          label={t('entry.placeOfBirth')}
          value={value.placeOfBirth}
          onChange={(v) => onChange({ placeOfBirth: v })}
        />
      </div>
      <div className="mt-3">
        <Field
          label={t('entry.passportNo')}
          value={value.passportNumber}
          onChange={(v) => onChange({ passportNumber: v.toUpperCase() })}
          placeholder="A12345678"
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field
          label={t('entry.passportIssue')}
          type="date"
          value={value.passportIssueDate}
          onChange={(v) => onChange({ passportIssueDate: v })}
        />
        <Field
          label={t('entry.passportExpiry')}
          type="date"
          value={value.passportExpiryDate}
          min={value.passportIssueDate || undefined}
          onChange={(v) => onChange({ passportExpiryDate: v })}
        />
      </div>
      <div className="mt-3">
        <label className="block">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            {t('entry.suppFrom')}
          </span>
          <select
            value={value.supportingDocFrom}
            onChange={(e) => onChange({ supportingDocFrom: e.target.value })}
            className="w-full rounded-xl px-3 py-2.5 text-[14px] text-gray-900 outline-none"
            style={{ border: '1px solid #E5E7EB', background: '#fff' }}
          >
            <option value="">{t('common.selectCountry')}</option>
            {supportCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Field
          label={t('entry.suppNo')}
          value={value.supportingDocNo}
          onChange={(v) => onChange({ supportingDocNo: v })}
        />
        <Field
          label={t('entry.suppExpiry')}
          type="date"
          value={value.supportingDocExpiry}
          onChange={(v) => onChange({ supportingDocExpiry: v })}
        />
      </div>
    </div>
  );
}

export default function EntryApplyForm({
  option,
  optionIndex = 0,
  insuranceDailyPrice = 5,
  currency = 'USD',
  onBack,
}: {
  option: OptionCard;
  optionIndex?: number;
  insuranceDailyPrice?: number;
  currency?: string;
  onBack?: () => void;
}) {
  const { t, lang } = useI18n();
  const today = new Date().toISOString().slice(0, 10);
  const unitPrice = option.price ?? 60;
  const supportCountries = useMemo(
    () => countriesFromTags(option.eligible_tags),
    [option.eligible_tags],
  );

  const [arrivalDate, setArrivalDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicants, setApplicants] = useState<Applicant[]>([emptyApplicant()]);
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

  const stayDays = daysBetween(arrivalDate, endDate);
  const validityEnd = arrivalDate ? addDays(arrivalDate, VALIDITY_DAYS - 1) : '';
  const personCount = applicants.length;
  const entryTotal = unitPrice * personCount;
  const insuranceTotal =
    stayDays > 0 ? insuranceDailyPrice * stayDays * personCount : 0;
  const grandTotal = entryTotal + insuranceTotal;

  const validityNote = arrivalDate
    ? t('entry.validityNote', {
        label: ePermitLabel(),
        from: formatLongDate(arrivalDate, lang),
        to: formatLongDate(validityEnd, lang),
        days: VALIDITY_DAYS,
        max: MAX_STAY_DAYS,
      })
    : t('entry.validityNoteEmpty', {
        label: ePermitLabel(),
        days: VALIDITY_DAYS,
        max: MAX_STAY_DAYS,
      });

  const updateApplicant = (idx: number, patch: Partial<Applicant>) => {
    setApplicants((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const addApplicant = () => {
    if (applicants.length >= 6) return;
    setApplicants((prev) => [...prev, emptyApplicant()]);
  };

  const removeApplicant = (idx: number) => {
    if (idx === 0 || applicants.length <= 1) return;
    setApplicants((prev) => prev.filter((_, i) => i !== idx));
  };

  const validApplicant = (a: Applicant, i: number) => {
    if (!a.firstName.trim() || !a.surname.trim()) return `Enter name for applicant ${i + 1}.`;
    if (!a.dateOfBirth) return `Enter date of birth for applicant ${i + 1}.`;
    if (!a.placeOfBirth.trim()) return `Enter place of birth for applicant ${i + 1}.`;
    if (!a.passportNumber.trim()) return `Enter passport number for applicant ${i + 1}.`;
    if (!a.passportIssueDate) return `Enter passport issue date for applicant ${i + 1}.`;
    if (!a.passportExpiryDate) return `Enter passport expiry date for applicant ${i + 1}.`;
    if (!a.supportingDocFrom) return `Select supporting doc. country for applicant ${i + 1}.`;
    if (!a.supportingDocNo.trim()) return `Enter supporting doc. number for applicant ${i + 1}.`;
    if (!a.supportingDocExpiry) return `Enter supporting doc. expiry for applicant ${i + 1}.`;
    return '';
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!arrivalDate || !endDate) {
      setError(t('entry.err.dates'));
      return;
    }
    if (stayDays < 1) {
      setError(t('entry.err.dates'));
      return;
    }
    if (stayDays > MAX_STAY_DAYS) {
      setError(t('entry.err.stayMax', { max: MAX_STAY_DAYS }));
      return;
    }
    for (let i = 0; i < applicants.length; i++) {
      const err = validApplicant(applicants[i], i);
      if (err) {
        setError(err);
        return;
      }
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('entry.err.email'));
      return;
    }
    if (!phone.trim()) {
      setError(t('entry.err.phone'));
      return;
    }
    if (!address.trim()) {
      setError(t('entry.err.address'));
      return;
    }
    setError('');
    setSubmitted(true);
  };

  if (submitted) {
    const primary = applicants[0];
    return (
      <PaymentForm
        amount={grandTotal}
        currency={currency}
        summary={`Entry + insurance · ${personCount} applicant${personCount === 1 ? '' : 's'} · ${email}`}
        onBack={() => setSubmitted(false)}
        onPay={async (meta) => {
          const order = await submitOrder({
            type: 'entry',
            amount: grandTotal,
            currency,
            email,
            phone,
            customer_name: `${primary.firstName} ${primary.surname}`.trim(),
            country: primary.supportingDocFrom || undefined,
            option_id: option.id,
            option_title: option.title,
            option_index: optionIndex,
            summary: `Option ${optionIndex + 1} · ${stayDays} days · ${personCount} applicant(s)`,
            payload: {
              arrivalDate,
              endDate,
              stayDays,
              entryTotal,
              insuranceTotal,
              address,
              applicants,
            },
            payment: meta,
            mark_paid: true,
          });
          return order.id;
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
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}
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
            label={t('entry.arrival')}
            type="date"
            value={arrivalDate}
            min={today}
            onChange={(v) => {
              setArrivalDate(v);
              if (endDate && endDate < v) setEndDate(v);
              const maxEnd = v ? addDays(v, MAX_STAY_DAYS - 1) : '';
              if (endDate && maxEnd && endDate > maxEnd) setEndDate(maxEnd);
            }}
          />
          <Field
            label={t('entry.endDate')}
            type="date"
            value={endDate}
            min={arrivalDate || today}
            max={arrivalDate ? addDays(arrivalDate, MAX_STAY_DAYS - 1) : undefined}
            onChange={setEndDate}
          />
        </div>

        <div
          className="mt-3 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
          style={{ background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #BFDBFE' }}
        >
          {validityNote}
        </div>

        {stayDays > 0 && (
          <div
            className="mt-3 rounded-xl px-3.5 py-2.5 flex justify-between text-[13px]"
            style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
          >
            <span className="text-gray-600">{t('entry.tripLength')}</span>
            <span className="font-bold" style={{ color: NAVY }}>
              {stayDays === 1
                ? t('entry.days', { n: stayDays })
                : t('entry.days_plural', { n: stayDays })}
            </span>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {applicants.map((a, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => removeApplicant(i)}
                    className="ml-auto text-[11px] font-semibold text-gray-500"
                  >
                    {t('common.remove')}
                  </button>
                )}
              </div>
              <ApplicantFields
                title={
                  i === 0
                    ? t('entry.applicantPrimary')
                    : t('entry.applicantN', { n: i + 1 })
                }
                value={a}
                onChange={(patch) => updateApplicant(i, patch)}
                supportCountries={supportCountries}
                t={t}
              />
            </div>
          ))}
        </div>

        {applicants.length < 6 && (
          <button
            type="button"
            onClick={addApplicant}
            className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold text-gray-700"
            style={{ border: '1px dashed #CBD5E1', background: '#F8FAFC' }}
          >
            {t('entry.addApplicant')}
          </button>
        )}

        {/* Contact — primary only */}
        <div className="mt-5">
          <div className="text-[12px] font-bold text-gray-800 mb-3">{t('entry.contact')}</div>
          <div className="space-y-3">
            <Field
              label={t('entry.email')}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              inputMode="email"
              autoComplete="email"
            />
            <Field
              label={t('entry.phone')}
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
        </div>

        {/* Insurance for registered applicants */}
        <div
          className="mt-6 rounded-xl px-3.5 py-4"
          style={{ border: '1px solid #FED7AA', background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' }}
        >
          <div className="font-bold text-[14px]" style={{ color: NAVY }}>
            {t('entry.insuranceTitle')}
          </div>
          <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
            {t('entry.insuranceBody')}
          </p>
          <ul className="mt-3 space-y-1 text-[12px] text-gray-700">
            {applicants.map((a, i) => (
              <li key={i}>
                <span className="font-semibold">
                  {a.firstName || a.surname
                    ? `${a.firstName} ${a.surname}`.trim()
                    : `Applicant ${i + 1}`}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-[12px] text-gray-600">
            ${insuranceDailyPrice} × {stayDays > 0 ? stayDays : 0} day
            {stayDays === 1 ? '' : 's'} × {personCount} traveler
            {personCount === 1 ? '' : 's'}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-[12px] font-semibold text-gray-500">{currency}</span>
            <span className="font-bold text-[24px]" style={{ color: NAVY }}>
              {stayDays > 0 ? insuranceTotal.toFixed(insuranceTotal % 1 ? 2 : 0) : '0'}
            </span>
          </div>
        </div>

        {/* Totals */}
        <div
          className="mt-5 rounded-xl px-3.5 py-3.5 text-[13px] space-y-2"
          style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
        >
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">
              {t('entry.entryFee', { currency, price: unitPrice, n: personCount })}
            </span>
            <span className="font-semibold text-gray-900">
              {currency} {entryTotal.toFixed(entryTotal % 1 ? 2 : 0)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">{t('entry.insuranceLine')}</span>
            <span className="font-semibold text-gray-900">
              {currency} {stayDays > 0 ? insuranceTotal.toFixed(insuranceTotal % 1 ? 2 : 0) : '0'}
            </span>
          </div>
          <div
            className="flex justify-between gap-3 pt-2 items-baseline"
            style={{ borderTop: '1px solid #E5E7EB' }}
          >
            <span className="font-bold text-gray-800">{t('entry.total')}</span>
            <span className="font-bold text-[22px]" style={{ color: NAVY }}>
              {currency} {stayDays > 0 ? grandTotal.toFixed(grandTotal % 1 ? 2 : 0) : entryTotal}
            </span>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!arrivalDate || !endDate || stayDays <= 0}
          className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-5 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
        >
          {t('entry.paymentNow')} · {currency}{' '}
          {stayDays > 0 ? grandTotal.toFixed(grandTotal % 1 ? 2 : 0) : entryTotal}
        </button>
      </form>
    </div>
  );
}
