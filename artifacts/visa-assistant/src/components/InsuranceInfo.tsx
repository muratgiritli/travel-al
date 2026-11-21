import { useEffect, useRef, useState } from 'react';
import type { ContentInsurance } from '@/lib/settings';
import InsuranceApplyForm from '@/components/InsuranceApplyForm';

const BTN = '#C73E54';
const BTN_DARK = '#A82E42';
const NAVY = '#0a1f44';
const GREEN = '#15803d';

export type FreeEntryIntro = {
  headline?: string;
  body?: string[];
  features?: string[];
};

function CheckLine({ text }: { text: string }) {
  const m = text.match(/^(\p{Extended_Pictographic}(?:[\uFE0F\u200D]\p{Extended_Pictographic}?)*)\s*/u);
  const icon = m ? m[1] : '✓';
  const label = m ? text.slice(m[0].length) : text;
  return (
    <li className="flex items-start gap-2 text-[13px] text-gray-800 leading-snug">
      <span className="shrink-0 font-bold mt-px" style={{ color: GREEN }}>
        {icon}
      </span>
      <span>{label}</span>
    </li>
  );
}

export default function InsuranceInfo({
  dailyPrice = 5,
  minDays = 1,
  copy,
  freeEntry,
  onFormVisibilityChange,
}: {
  dailyPrice?: number;
  minDays?: number;
  copy: ContentInsurance;
  /** Visa-free passport intro — same frame, above the offer */
  freeEntry?: FreeEntryIntro | null;
  onFormVisibilityChange?: (open: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const notifyRef = useRef(onFormVisibilityChange);
  notifyRef.current = onFormVisibilityChange;
  const features = copy.features?.length
    ? copy.features
    : (copy.benefits || []).map((b) => b.title).filter(Boolean);
  const paragraphs = copy.paragraphs || [];
  const introBody = (freeEntry?.body || []).filter(Boolean);
  const introFeatures = (freeEntry?.features || []).filter(Boolean);

  const setFormOpen = (open: boolean) => {
    setShowForm(open);
    notifyRef.current?.(open);
  };

  useEffect(() => () => notifyRef.current?.(false), []);

  if (showForm) {
    return (
      <InsuranceApplyForm
        dailyPrice={dailyPrice}
        minDays={minDays}
        onBack={() => setFormOpen(false)}
      />
    );
  }

  return (
    <div
      className="rounded-2xl px-4 py-5 bg-white"
      style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 10px rgba(15,23,42,.06)' }}
    >
      {freeEntry && (freeEntry.headline || introBody.length > 0 || introFeatures.length > 0) && (
        <div className="mb-5 pb-5" style={{ borderBottom: '1px solid #E5E7EB' }}>
          {freeEntry.headline && (
            <h3 className="font-bold text-[15px] leading-snug" style={{ color: GREEN }}>
              {freeEntry.headline}
            </h3>
          )}
          {introBody.length > 0 && (
            <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-gray-700">
              {introBody.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {introFeatures.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {introFeatures.map((f) => (
                <CheckLine key={f} text={f} />
              ))}
            </ul>
          )}
        </div>
      )}

      {copy.title && (
        <h2 className="font-bold text-[18px] leading-snug" style={{ color: NAVY }}>
          {copy.title}
        </h2>
      )}

      {features.length > 0 && (
        <ul className="mt-3 space-y-2">
          {features.map((f) => (
            <CheckLine key={f} text={f} />
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
            {copy.daily_label}
          </div>
        </div>
        <div className="shrink-0 text-right leading-none">
          <div className="text-[11px] font-semibold text-gray-400 mb-1">USD</div>
          <span className="font-bold text-[26px]" style={{ color: NAVY }}>
            {dailyPrice}
          </span>
          <span className="ml-1 text-[13px] font-semibold text-gray-500">
            {copy.per_day_label}
          </span>
        </div>
      </div>

      {(copy.important_title || paragraphs.length > 0 || copy.important_note) && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
          {copy.important_title && (
            <h3 className="font-bold text-[14px] text-gray-900 mb-2">{copy.important_title}</h3>
          )}
          {paragraphs.length > 0 && (
            <div className="space-y-2.5 text-[12.5px] leading-relaxed text-gray-700">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {copy.important_note && (
            <p className="mt-3 text-[12.5px] leading-relaxed font-semibold" style={{ color: '#9A3412' }}>
              {copy.important_note}
            </p>
          )}
        </div>
      )}

      {copy.cta_label && (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-5"
          style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
        >
          {copy.cta_label}
        </button>
      )}
    </div>
  );
}
