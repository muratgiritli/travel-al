import { useState } from 'react';
import type { OptionCard } from '@/lib/settings';
import { useI18n, localizeOptionCard } from '@/lib/i18n';

const BTN = '#2563EB';
const BTN_DARK = '#1D4ED8';

const BADGE_STYLES = [
  { background: '#DBEAFE', color: '#1D4ED8' },
  { background: '#DCFCE7', color: '#15803D' },
  { background: '#FFEDD5', color: '#C2410C' },
  { background: '#EDE9FE', color: '#6D28D9' },
];

const INFO_BOX_STYLES = [
  { background: '#EFF6FF', color: '#1E3A8A', border: '1px solid #BFDBFE' },
  { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' },
  { background: '#FFF7ED', color: '#9A3412', border: '1px solid #FED7AA' },
  { background: '#F5F3FF', color: '#5B21B6', border: '1px solid #DDD6FE' },
];

function isStickerCard(card: OptionCard): boolean {
  return card.id === 'sticker' || card.id === 'consultancy';
}

function InsuranceBadge({ label }: { label: string }) {
  if (!label) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
    >
      🛡️ {label}
    </span>
  );
}

function parseTag(tag: string): { code: string; name: string } {
  const m = tag.trim().match(/^([A-Z]{2,3})\s+(.+)$/);
  if (m) return { code: m[1], name: m[2] };
  return { code: '', name: tag };
}

function TagGrid({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {tags.map((t) => {
        const { code, name } = parseTag(t);
        return (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-700"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}
          >
            {code && (
              <span className="font-bold text-gray-500 tracking-wide">{code}</span>
            )}
            <span>{name}</span>
          </span>
        );
      })}
    </div>
  );
}

function resolveInfoBox(card: OptionCard): string | null {
  if (card.bullets && card.bullets.length > 0) {
    return card.bullets.join(' ');
  }
  return null;
}

/**
 * Option card layout — all copy from admin/API card fields.
 */
export function OptionCardView({
  card,
  index,
  showInsurance = true,
  insuranceBadge = '',
  onApply,
}: {
  card: OptionCard;
  index: number;
  showInsurance?: boolean;
  insuranceBadge?: string;
  /** When set, CTA opens in-chat form instead of navigating away */
  onApply?: (card: OptionCard, index: number) => void;
}) {
  const { t, lang } = useI18n();
  const loc = localizeOptionCard(card, lang);
  const hideInsurance = index === 2 || loc.id === 'gcc' || isStickerCard(loc);
  const tags = loc.eligible_tags || [];
  const infoBox = resolveInfoBox(loc);
  const currency = loc.currency || 'USD';
  const subtitle = loc.description || loc.condition || '';
  const badge = BADGE_STYLES[index % BADGE_STYLES.length];
  const infoStyle = INFO_BOX_STYLES[index % INFO_BOX_STYLES.length];
  /** In-chat application form for Option 1–4 */
  const useInChatApply = Boolean(onApply) && index >= 0 && index <= 3;
  const needsAgeConfirm = Boolean(loc.require_age_confirm) || loc.id === 'age-direct';
  const [ageOk, setAgeOk] = useState<'' | 'yes' | 'no'>('');
  const applyEnabled = !needsAgeConfirm || ageOk === 'yes';
  const ageInfo = loc.age_confirm_info || t('option.ageInfo');
  const ageQuestion = loc.age_confirm_question || t('option.ageQuestion');

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4 bg-white"
      style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 10px rgba(15,23,42,.06)' }}
    >
      <div className="px-4 pt-4 pb-4">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase"
          style={badge}
        >
          {t('option.label', { n: index + 1 })}
        </span>

        <div className="flex items-start justify-between gap-3 mt-3">
          <h3 className="font-bold text-[18px] leading-snug" style={{ color: '#1E3A8A' }}>
            {loc.title}
          </h3>
          <div className="shrink-0 text-right leading-none pt-0.5 whitespace-nowrap">
            <span className="font-bold text-[22px]" style={{ color: '#1E3A8A' }}>
              ${loc.price}
            </span>
            <span className="ml-1.5 text-[12px] font-semibold text-gray-400 align-top">
              {currency}
            </span>
          </div>
        </div>

        {subtitle && (
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}

        {infoBox && (
          <div
            className="mt-3 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
            style={infoStyle}
          >
            {infoBox}
          </div>
        )}

        {tags.length > 0 && <TagGrid tags={tags} />}

        {showInsurance && !hideInsurance && (
          <div className="mt-3">
            <InsuranceBadge label={insuranceBadge} />
          </div>
        )}

        {needsAgeConfirm && (
          <div
            className="mt-4 rounded-xl px-3.5 py-3"
            style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
          >
            <p className="text-[13px] leading-relaxed font-medium" style={{ color: '#1E3A8A' }}>
              {ageInfo}
            </p>
            <p className="text-[12px] font-semibold text-gray-700 mt-3 mb-2">{ageQuestion}</p>
            <div className="flex gap-2">
              {(
                [
                  { id: 'yes', label: 'Yes' },
                  { id: 'no', label: 'No' },
                ] as const
              ).map((opt) => {
                const active = ageOk === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAgeOk(opt.id)}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-bold"
                    style={{
                      border: active ? `1.5px solid ${BTN}` : '1px solid #E5E7EB',
                      background: active ? '#DBEAFE' : '#fff',
                      color: active ? BTN_DARK : '#374151',
                    }}
                  >
                    {opt.id === 'yes' ? t('common.yes') : t('common.no')}
                  </button>
                );
              })}
            </div>
            {ageOk === 'no' && (
              <p className="text-[12px] text-amber-800 mt-2.5 leading-relaxed">
                {t('option.ageNoHint')}
              </p>
            )}
          </div>
        )}

        {useInChatApply ? (
          <button
            type="button"
            disabled={!applyEnabled}
            onClick={() => {
              if (!applyEnabled) return;
              onApply?.(card, index); // original card (ids/tags); display used loc
            }}
            className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-4 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
          >
            {loc.id === 'direct' && loc.price === 0 ? t('common.continue') : t('option.applyNow')}
          </button>
        ) : (
          applyEnabled ? (
            <a
              href={card.cta_href || '/next'}
              className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-4 transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
            >
              {loc.id === 'direct' && loc.price === 0 ? t('common.continue') : t('option.applyNow')}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-4 opacity-40 cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${BTN}, ${BTN_DARK})` }}
            >
              {loc.id === 'direct' && loc.price === 0 ? t('common.continue') : t('option.applyNow')}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function OptionCards({
  cards,
  showInsurance = true,
  insuranceBadge = '',
  onApply,
}: {
  cards: OptionCard[];
  showInsurance?: boolean;
  insuranceBadge?: string;
  onApply?: (card: OptionCard, index: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-3">
      {cards.map((card, i) => (
        <OptionCardView
          key={card.id || i}
          card={card}
          index={i}
          showInsurance={showInsurance}
          insuranceBadge={insuranceBadge}
          onApply={onApply}
        />
      ))}
    </div>
  );
}
