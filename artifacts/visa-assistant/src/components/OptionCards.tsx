import type { OptionCard } from '@/lib/settings';

const HEADER_COLORS = ['#1e3a8a', '#065f46', '#7c2d12', '#4c1d95'];

function InsuranceBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
    >
      🛡️ Insurance required
    </span>
  );
}

function formatPrice(card: OptionCard): string {
  const currency = card.currency || 'USD';
  return `$${card.price} ${currency}`;
}

function TagGrid({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
      {tags.map(t => (
        <span
          key={t}
          className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
          style={{ background: '#f0f4ff', color: '#1e3a8a' }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/**
 * Renders a single admin-editable option/offer card, preserving the existing
 * navy-header (OPTION n + price) / white-body visual style.
 */
export function OptionCardView({
  card,
  index,
  showInsurance = true,
}: {
  card: OptionCard;
  index: number;
  showInsurance?: boolean;
}) {
  const color = HEADER_COLORS[index % HEADER_COLORS.length];
  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}
    >
      {/* Colored header */}
      <div className="px-4 py-3" style={{ background: color }}>
        <div className="flex items-center justify-between">
          <span className="text-white text-[12px] font-bold tracking-wide uppercase opacity-80">
            Option {index + 1}
          </span>
          <span className="text-white font-bold text-[15px]">{formatPrice(card)}</span>
        </div>
        <div className="text-white font-bold text-[16px] mt-0.5">{card.title}</div>
      </div>

      {/* Body */}
      <div className="bg-white px-4 pt-3 pb-4">
        {card.condition && (
          <>
            <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Condition
            </p>
            <p className="text-[13px] text-gray-700 mb-2">{card.condition}</p>
          </>
        )}

        {card.description && (
          <p className="text-[13px] text-gray-600 mb-2">{card.description}</p>
        )}

        {card.eligible_tags && card.eligible_tags.length > 0 && (
          <TagGrid tags={card.eligible_tags} />
        )}

        {card.bullets && card.bullets.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-[13px] text-gray-600 mt-2">
            {card.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {showInsurance && <div className="mt-3 mb-1"><InsuranceBadge /></div>}

        <a
          href={card.cta_href}
          className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-3 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}
        >
          {card.cta_label}
        </a>
      </div>
    </div>
  );
}

/**
 * Renders the full list of active option cards (already active-filtered &
 * sorted by the API).
 */
export default function OptionCards({
  cards,
  showInsurance = true,
}: {
  cards: OptionCard[];
  showInsurance?: boolean;
}) {
  return (
    <>
      {cards.map((card, i) => (
        <OptionCardView key={card.id || i} card={card} index={i} showInsurance={showInsurance} />
      ))}
    </>
  );
}
