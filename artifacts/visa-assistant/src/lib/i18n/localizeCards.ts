import type { OptionCard } from '@/lib/settings';
import { WIRE_CAT, type WireCategory } from '@/lib/wireCodes';
import { translate } from './messages';
import type { LangCode } from './types';

type EntryLike = {
  country: string;
  category: WireCategory;
  headline: string;
  body: string[];
  features: string[];
  insurance_required?: boolean;
  top_block?: {
    max_stay_text?: string;
    passport_validity_text?: string;
    insurance_label?: string;
  };
  [key: string]: unknown;
};

function t(lang: LangCode, key: string, vars?: Record<string, string | number>) {
  return translate(lang, key, vars);
}

function categoryPack(category: WireCategory): 'free' | 'direct' | 'cond' | 'age' | 'sticker' | null {
  if (category === WIRE_CAT.entryFree) return 'free';
  if (category === WIRE_CAT.ePermitDirect) return 'direct';
  if (category === WIRE_CAT.ePermitConditional) return 'cond';
  if (category === WIRE_CAT.ageSpecial) return 'age';
  if (category === WIRE_CAT.stickerMission) return 'sticker';
  return null;
}

/** Localize entry card headline / body / features (and common top_block value labels). */
export function localizeEntryCard<T extends EntryLike>(card: T, lang: LangCode): T {
  const pack = categoryPack(card.category);
  const country = card.country || '';
  const insuranceBody = t(lang, 'card.insuranceBody');

  let headline = card.headline;
  let body0 = card.body?.[0] || '';
  let features = card.features || [];

  if (pack) {
    headline = t(lang, `card.${pack}.headline`);
    body0 = t(lang, `card.${pack}.body`, { country });
    features = [
      t(lang, `card.${pack}.f1`),
      t(lang, `card.${pack}.f2`),
      t(lang, `card.${pack}.f3`),
    ];
  }

  const body: string[] = [body0];
  if (card.insurance_required !== false) {
    body.push(insuranceBody);
  } else if ((card.body || []).length > 1) {
    body.push(insuranceBody);
  }

  const tb = card.top_block ? { ...card.top_block } : undefined;
  if (tb) {
    if (!tb.passport_validity_text || /minimum\s+180/i.test(tb.passport_validity_text)) {
      tb.passport_validity_text = t(lang, 'site.card.passport_default');
    }
    if (!tb.insurance_label || /^required$/i.test(tb.insurance_label)) {
      tb.insurance_label = t(lang, 'site.card.insurance_required');
    }
    if (tb.max_stay_text) {
      if (/see details below/i.test(tb.max_stay_text)) {
        tb.max_stay_text = t(lang, 'site.card.max_stay_fallback');
      } else {
        tb.max_stay_text = localizeStaySnippet(tb.max_stay_text, lang);
      }
    }
  }

  return {
    ...card,
    headline,
    body: body.filter(Boolean),
    features,
    top_block: tb,
  };
}

/** Localize a stay snippet like "90 days" / "90 Days, Multiple Entry". */
export function localizeStaySnippet(raw: string, lang: LangCode): string {
  const s = (raw || '').trim();
  if (!s) return s;
  const m = s.match(/(\d+)\s*days?\b(?:\s*,?\s*(single|multiple)\s*entry)?/i);
  if (!m) return s;
  const n = m[1];
  const entryKind = (m[2] || '').toLowerCase();
  if (entryKind === 'single' || entryKind === 'multiple') {
    return t(lang, 'card.nDaysEntry', {
      n,
      entry: t(lang, `card.entry.${entryKind}`),
    });
  }
  return t(lang, 'card.nDays', { n });
}

const TAG_MAP: Record<string, string> = {
  'document preparation': 'opt.tag.docPrep',
  'embassy appointment': 'opt.tag.embassy',
  'form & biometric support': 'opt.tag.forms',
  'application tracking': 'opt.tag.tracking',
};

function localizeTags(tags: string[] | undefined, lang: LangCode): string[] | undefined {
  if (!tags?.length) return tags;
  return tags.map((tag) => {
    const key = TAG_MAP[tag.trim().toLowerCase()];
    return key ? t(lang, key) : tag;
  });
}

type OptPack = {
  title: string;
  description: string;
  condition?: string;
  bullets?: string[];
};

function optionPack(id: string, lang: LangCode): OptPack | null {
  switch (id) {
    case 'resident':
      return {
        title: t(lang, 'opt.ePermit.title'),
        description: t(lang, 'opt.resident.desc'),
        bullets: [t(lang, 'opt.resident.bullet')],
      };
    case 'valid-permit':
      return {
        title: t(lang, 'opt.ePermit.title'),
        description: t(lang, 'opt.validPermit.desc'),
        bullets: [t(lang, 'opt.validPermit.bullet')],
      };
    case 'gcc':
      return {
        title: t(lang, 'opt.entryPermit.title'),
        description: t(lang, 'opt.gcc.desc'),
        bullets: [t(lang, 'opt.gcc.bullet')],
      };
    case 'sticker':
    case 'consultancy':
      return {
        title: t(lang, 'opt.entryPermit.title'),
        description: t(lang, 'opt.sticker.desc'),
        bullets: [t(lang, 'opt.sticker.bullet')],
      };
    case 'age-direct':
      return {
        title: t(lang, 'opt.ePermit.title'),
        description: t(lang, 'opt.ageDirect.desc'),
        bullets: [t(lang, 'opt.ageDirect.b1'), t(lang, 'opt.ageDirect.b2')],
      };
    case 'age-permit':
      return {
        title: t(lang, 'opt.ePermit.title'),
        description: t(lang, 'opt.agePermit.desc'),
        condition: t(lang, 'opt.agePermit.condition'),
        bullets: [t(lang, 'opt.validPermit.bullet')],
      };
    default:
      return null;
  }
}

/** Localize option card title/description/bullets/tags/age copy by stable id. */
export function localizeOptionCard(card: OptionCard, lang: LangCode): OptionCard {
  const pack = optionPack(card.id || '', lang);
  if (!pack) {
    return {
      ...card,
      eligible_tags: localizeTags(card.eligible_tags, lang),
      age_confirm_info: card.require_age_confirm || card.id === 'age-direct'
        ? t(lang, 'option.ageInfo')
        : card.age_confirm_info,
      age_confirm_question: card.require_age_confirm || card.id === 'age-direct'
        ? t(lang, 'option.ageQuestion')
        : card.age_confirm_question,
      cta_label: t(lang, 'option.applyNow'),
    };
  }
  return {
    ...card,
    title: pack.title,
    description: pack.description,
    condition: pack.condition ?? card.condition,
    bullets: pack.bullets ?? card.bullets,
    eligible_tags: localizeTags(card.eligible_tags, lang),
    age_confirm_info: card.require_age_confirm || card.id === 'age-direct'
      ? t(lang, 'option.ageInfo')
      : card.age_confirm_info,
    age_confirm_question: card.require_age_confirm || card.id === 'age-direct'
      ? t(lang, 'option.ageQuestion')
      : card.age_confirm_question,
    cta_label: t(lang, 'option.applyNow'),
  };
}

export function localizeOptionCards(cards: OptionCard[] | undefined, lang: LangCode): OptionCard[] | undefined {
  if (!cards) return cards;
  return cards.map((c) => localizeOptionCard(c, lang));
}
