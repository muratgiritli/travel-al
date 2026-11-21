// ── Shared admin UI primitives ────────────────────────────────────────────────
import { ReactNode } from 'react';
import { hasForbiddenWord, FORBIDDEN_WARNING } from './api';
import { WIRE_CAT } from '@/lib/wireCodes';

export const NAVY = '#0a1f44';
export const GOLD = '#c5a059';
export const BG = '#f4f6f9';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 md:p-6 ${className}`}
      style={{ border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(10,31,68,.06)' }}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  checkForbidden = false,
  mono = false,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  checkForbidden?: boolean;
  mono?: boolean;
}) {
  const forbidden = checkForbidden && hasForbiddenWord(value);
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-blue-400 ${
          mono ? 'font-mono text-[13px]' : ''
        } ${forbidden ? 'border-red-400' : 'border-gray-200'}`}
      />
      {forbidden && <ForbiddenWarning />}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  checkForbidden = false,
  mono = false,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  checkForbidden?: boolean;
  mono?: boolean;
}) {
  const forbidden = checkForbidden && hasForbiddenWord(value);
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border rounded-xl px-3 py-2.5 text-[14px] outline-none resize-y focus:border-blue-400 ${
          mono ? 'font-mono text-[13px]' : ''
        } ${forbidden ? 'border-red-400' : 'border-gray-200'}`}
      />
      {forbidden && <ForbiddenWarning />}
    </div>
  );
}

export function ForbiddenWarning() {
  return <p className="text-red-600 text-[12px] mt-1 font-medium">⚠ {FORBIDDEN_WARNING}</p>;
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex items-center gap-2 select-none"
        aria-pressed={checked}
      >
        <span
          className="relative inline-block w-11 h-6 rounded-full transition-colors"
          style={{ background: checked ? '#16a34a' : '#cbd5e1' }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
            style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </span>
        <span className="text-[14px] text-gray-700">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none bg-white focus:border-blue-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'gold' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: NAVY, color: '#fff' },
    gold: { background: GOLD, color: '#fff' },
    ghost: { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' },
    danger: { background: '#fff', color: '#dc2626', border: '1px solid #fecaca' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-2.5 rounded-xl font-semibold text-[14px] transition-colors disabled:opacity-60 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

export function Toast({ message, kind = 'ok' }: { message: string; kind?: 'ok' | 'error' }) {
  return (
    <div
      className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-white text-[13px] font-semibold z-50 shadow-lg"
      style={{ background: kind === 'ok' ? '#16a34a' : '#dc2626' }}
    >
      {message}
    </div>
  );
}

export const CATEGORY_OPTIONS = [
  { value: WIRE_CAT.entryFree, label: 'Entry free' },
  { value: WIRE_CAT.ePermitDirect, label: 'Direct online' },
  { value: WIRE_CAT.ePermitConditional, label: 'Conditional online' },
  { value: WIRE_CAT.ageSpecial, label: 'Age-specific rules' },
  { value: WIRE_CAT.stickerMission, label: 'Mission / sticker' },
];

export function categoryLabel(cat: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat;
}
