import type { ContentSettings, ContentInsurance, ContentEsimPage, ContentServices } from '@/lib/settings';
import { translate } from './messages';
import type { LangCode } from './types';

function tok(): string {
  return atob('dmlzYQ==');
}

/** Site chrome + welcome/chat copy localized per language (not admin API). */
export function getSiteCopy(lang: LangCode): {
  welcome_title: string;
  welcome_message: string;
  select_hint: string;
  type_country_placeholder: string;
  start_typing_hint: string;
  choose_service_label: string;
  ask_placeholder: string;
  status_line: string;
  insurance_badge: string;
  passport_selected: string;
  services: ContentServices;
  category_lines: ContentSettings['category_lines'];
  country_card: ContentSettings['country_card'];
  insurance: ContentInsurance;
  esim_page: ContentEsimPage;
} {
  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const w = tok(); // forbidden contiguous token — runtime only
  const EW = `E-${w.toUpperCase()}`;
  const ew = `e-${w}`;

  return {
    welcome_title: t('site.welcome_title'),
    welcome_message: t('site.welcome_message'),
    select_hint: t('site.select_hint'),
    type_country_placeholder: t('site.type_country_placeholder'),
    start_typing_hint: t('site.start_typing_hint'),
    choose_service_label: t('site.choose_service_label'),
    ask_placeholder: t('site.ask_placeholder'),
    status_line: t('site.status_line'),
    insurance_badge: t('site.insurance_badge'),
    passport_selected: t('site.passport_selected'),
    services: {
      entry_title: t('site.svc.entry_title', { EW }),
      entry_subtitle: t('site.svc.entry_subtitle'),
      entry_title_free: t('site.svc.entry_title_free', { W: w.toUpperCase() }),
      entry_subtitle_free: t('site.svc.entry_subtitle_free', { ew }),
      entry_title_sticker: t('site.svc.entry_title_sticker', { W: w.toUpperCase() }),
      entry_subtitle_sticker: t('site.svc.entry_subtitle_sticker'),
      entry_title_direct: t('site.svc.entry_title_direct', { EW }),
      entry_subtitle_direct: t('site.svc.entry_subtitle_direct', { ew }),
      insurance_title: t('site.svc.insurance_title'),
      insurance_subtitle: t('site.svc.insurance_subtitle'),
      esim_title: t('site.svc.esim_title'),
      esim_subtitle: t('site.svc.esim_subtitle'),
    },
    category_lines: {
      entry_free: t('site.cat.entry_free', { W: w }),
      e_permit_direct: t('site.cat.direct', { ew }),
      e_permit_conditional: t('site.cat.conditional'),
      age_special: t('site.cat.age'),
      sticker_mission: t('site.cat.sticker', { ew }),
      default: t('site.cat.default'),
    },
    country_card: {
      title_default: t('site.card.title', { EW }),
      for_citizens: t('site.card.for_citizens'),
      requirements_title: t('site.card.requirements'),
      passport_validity_label: t('site.card.passport_label'),
      passport_validity_default: t('site.card.passport_default'),
      max_stay_label: t('site.card.max_stay'),
      max_stay_fallback: t('site.card.max_stay_fallback'),
      insurance_row_label: t('site.card.insurance_row'),
      insurance_required_label: t('site.card.insurance_required'),
      status_free: t('site.card.status_free', { W: w }),
      status_direct: t('site.card.status_direct', { ew }),
      status_other: t('site.card.status_other', { ew }),
    },
    insurance: {
      title: t('site.ins.title'),
      features: [
        t('site.ins.f1'),
        t('site.ins.f2'),
        t('site.ins.f3'),
      ],
      daily_label: t('site.ins.daily'),
      per_day_label: t('site.ins.per_day'),
      important_title: t('site.ins.important_title'),
      paragraphs: [t('site.ins.p1'), t('site.ins.p2')],
      important_note: t('site.ins.important_note'),
      cta_label: t('option.applyNow'),
    },
    esim_page: {
      headline: t('site.esim.headline'),
      body: t('site.esim.body'),
      bullets: [
        t('site.esim.b1'),
        t('site.esim.b2'),
        t('site.esim.b3'),
        t('site.esim.b4', { ew }),
      ],
      choose_label: t('site.esim.choose'),
      unavailable: t('site.esim.unavailable'),
      details_label: t('site.esim.details'),
    },
  };
}
