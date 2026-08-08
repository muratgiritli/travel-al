import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import InsuranceApplyForm from '@/components/InsuranceApplyForm';

/** Fuchsia / hot-pink palette — mirrors evisacity.com/china insurance landing */
const FUCHSIA = '#E11D8C';
const FUCHSIA_DARK = '#BE185D';
const FUCHSIA_SOFT = '#FDF2F8';
const FUCHSIA_MID = '#FCE7F3';
const INK = '#1E1033';

const WHO_KEYS = [
  { title: 'insLand.who.passport.title', body: 'insLand.who.passport.body', emoji: '🛂' },
  { title: 'insLand.who.medical.title', body: 'insLand.who.medical.body', emoji: '🏥' },
  { title: 'insLand.who.cities.title', body: 'insLand.who.cities.body', emoji: '🏙️' },
  { title: 'insLand.who.adventure.title', body: 'insLand.who.adventure.body', emoji: '🎈' },
  { title: 'insLand.who.families.title', body: 'insLand.who.families.body', emoji: '👨‍👩‍👧‍👦' },
  { title: 'insLand.who.coastal.title', body: 'insLand.who.coastal.body', emoji: '🌊' },
] as const;

const FAQ_KEYS = [
  { q: 'insLand.faq.q1', a: 'insLand.faq.a1' },
  { q: 'insLand.faq.q2', a: 'insLand.faq.a2' },
  { q: 'insLand.faq.q3', a: 'insLand.faq.a3' },
  { q: 'insLand.faq.q4', a: 'insLand.faq.a4' },
  { q: 'insLand.faq.q5', a: 'insLand.faq.a5' },
  { q: 'insLand.faq.q6', a: 'insLand.faq.a6' },
] as const;

const TRUST_KEYS = [
  'insLand.trust.ssl',
  'insLand.trust.law',
  'insLand.trust.cards',
  'insLand.trust.refund',
  'insLand.trust.support',
] as const;

function useOfferTimer(seconds = 15 * 60) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((s) => (s <= 1 ? seconds : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{
        background: 'rgba(225,29,140,.12)',
        color: FUCHSIA_DARK,
        border: '1px solid rgba(225,29,140,.28)',
      }}
    >
      {children}
    </span>
  );
}

export default function InsuranceExemptLanding({
  country,
  flagEmoji,
  dailyPrice = 5,
  minDays = 1,
  onFormVisibilityChange,
}: {
  country: string;
  flagEmoji?: string;
  dailyPrice?: number;
  minDays?: number;
  onFormVisibilityChange?: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const notifyRef = useRef(onFormVisibilityChange);
  notifyRef.current = onFormVisibilityChange;
  const timer = useOfferTimer();
  const browsing = useMemo(() => 18 + (country.length * 3) % 27, [country]);
  const listPrice = Math.round(dailyPrice / (1 - 0.37) * 10) / 10;
  const vars = { country, n: browsing };

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
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(165deg, ${FUCHSIA_SOFT} 0%, #fff 38%, ${FUCHSIA_MID} 100%)`,
        border: '1px solid rgba(225,29,140,.22)',
        boxShadow: '0 10px 36px rgba(190,24,93,.12)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Hero */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-white"
            style={{ background: FUCHSIA }}
          >
            {flagEmoji || '🌍'} {country}
          </span>
          <span className="text-[13px] font-bold" style={{ color: FUCHSIA }}>
            +
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-white"
            style={{ background: INK }}
          >
            🇹🇷 Türkiye
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <Chip>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22C55E' }} />
            {t('insLand.browsing', vars)}
          </Chip>
          <Chip>✓ {t('insLand.exemptBadge')}</Chip>
        </div>

        <p className="text-[14px] leading-relaxed text-center" style={{ color: INK }}>
          {t('insLand.pitchLead', vars)}{' '}
          <strong style={{ color: FUCHSIA_DARK }}>{t('insLand.pitchEmphasis')}</strong>{' '}
          {t('insLand.pitchTail')}
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <Chip>✓ {t('insLand.chip.law')}</Chip>
          <Chip>✓ {t('insLand.chip.pdf')}</Chip>
          <Chip>✓ {t('insLand.chip.hospitals')}</Chip>
          <Chip>
            <span style={{ color: FUCHSIA }}>37%</span> {t('insLand.chip.discount')}
          </Chip>
        </div>
      </div>

      {/* Limited offer + price */}
      <div
        className="mx-4 mb-4 rounded-2xl px-4 py-4"
        style={{
          background: `linear-gradient(135deg, ${FUCHSIA} 0%, ${FUCHSIA_DARK} 100%)`,
          boxShadow: '0 8px 24px rgba(190,24,93,.35)',
        }}
      >
        <div className="text-center text-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-white/85">
            {t('insLand.offerTitle', vars)}
          </div>
          <div className="text-[12px] text-white/80 mt-0.5">{t('insLand.offerSub')}</div>
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-white/75">
            {t('insLand.offerExpires')}
          </div>
          <div className="mt-1 font-black text-[34px] tabular-nums leading-none tracking-tight">
            {timer}
          </div>

          <div className="mt-4 flex items-end justify-center gap-2">
            <span className="text-[15px] text-white/70 line-through tabular-nums">
              ${listPrice}
            </span>
            <span className="text-[36px] font-black leading-none">${dailyPrice}</span>
            <span className="text-[13px] font-semibold text-white/85 pb-1">
              {t('insLand.perDay')}
            </span>
          </div>
          <div className="text-[11px] text-white/75 mt-1">{t('insLand.priceNote')}</div>

          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-4 w-full rounded-xl py-3.5 text-[15px] font-black"
            style={{
              background: '#fff',
              color: FUCHSIA_DARK,
              boxShadow: '0 4px 14px rgba(0,0,0,.12)',
            }}
          >
            {t('insLand.cta')}
          </button>
        </div>
      </div>

      {/* Who it's for */}
      <div className="px-4 pb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: FUCHSIA }}>
          {t('insLand.whoLabel')}
        </div>
        <h2 className="mt-1 font-black text-[18px] leading-snug" style={{ color: INK }}>
          {t('insLand.whoTitle', vars)}
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-2.5">
          {WHO_KEYS.map((item) => (
            <div
              key={item.title}
              className="rounded-xl px-3.5 py-3 bg-white/90"
              style={{ border: '1px solid rgba(225,29,140,.16)' }}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[18px] shrink-0" aria-hidden>
                  {item.emoji}
                </span>
                <div>
                  <div className="text-[13px] font-bold" style={{ color: INK }}>
                    {t(item.title)}
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-gray-600">
                    {t(item.body, vars)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-4 pt-4 pb-2">
        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: FUCHSIA }}>
          {t('insLand.faqLabel')}
        </div>
        <h2 className="mt-1 font-black text-[18px] leading-snug" style={{ color: INK }}>
          {t('insLand.faqTitle', vars)}
        </h2>
        <div className="mt-3 divide-y divide-pink-100 rounded-xl bg-white/90 overflow-hidden" style={{ border: '1px solid rgba(225,29,140,.16)' }}>
          {FAQ_KEYS.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full text-left px-3.5 py-3 flex items-start justify-between gap-2"
                >
                  <span className="text-[13px] font-semibold" style={{ color: INK }}>
                    {t(item.q, vars)}
                  </span>
                  <span className="shrink-0 font-bold" style={{ color: FUCHSIA }}>
                    {open ? '−' : '+'}
                  </span>
                </button>
                {open && (
                  <p className="px-3.5 pb-3 text-[12.5px] leading-relaxed text-gray-600">
                    {t(item.a, vars)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust strip */}
      <div className="px-4 py-4 flex flex-wrap justify-center gap-2">
        {TRUST_KEYS.map((key) => (
          <span
            key={key}
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md"
            style={{ background: 'rgba(30,16,51,.06)', color: '#6B7280' }}
          >
            {t(key)}
          </span>
        ))}
      </div>

      <div className="px-4 pb-5">
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="w-full rounded-xl py-3.5 text-[15px] font-black text-white"
          style={{ background: `linear-gradient(135deg, ${FUCHSIA}, ${FUCHSIA_DARK})` }}
        >
          {t('insLand.cta')}
        </button>
      </div>
    </motion.div>
  );
}
