/**
 * Seed copy for admin-editable site content.
 * Lives only on the API (not in the public frontend bundle).
 * Public UI reads these via GET /api/travel/settings → content.
 */

export const SCHENGEN_RESIDENCE_TAGS = [
  'AT Austria', 'BE Belgium', 'CZ Czech Rep', 'DK Denmark', 'EE Estonia',
  'FI Finland', 'FR France', 'DE Germany', 'GR Greece', 'HU Hungary',
  'IS Iceland', 'IT Italy', 'LV Latvia', 'LI Liechtenstein', 'LT Lithuania',
  'LU Luxembourg', 'MT Malta', 'NL Netherlands', 'NO Norway', 'PL Poland',
  'PT Portugal', 'SK Slovakia', 'SI Slovenia', 'ES Spain', 'SE Sweden',
  'CH Switzerland',
];

export const CONTENT_SEED = {
  welcome_title: 'Welcome to Türkiye',
  select_hint: 'Start by selecting your passport country.',
  type_country_placeholder: 'Type your passport country...',
  start_typing_hint: 'Start typing your country name',
  choose_service_label: 'Choose a service',
  ask_placeholder: 'Ask about entry, insurance, or stay duration...',
  status_line: 'Updated entry guidance',
  insurance_badge: 'Insurance required',
  services: {
    entry_title: 'TURKEY E-VISA',
    entry_subtitle: 'Entry options & application paths',
    entry_title_free: 'VISA FREE',
    entry_subtitle_free: 'No e-visa required for eligible stays',
    entry_title_sticker: 'TURKEY VISA',
    entry_subtitle_sticker: 'Embassy / sticker application support',
    entry_title_direct: 'TURKEY E-VISA',
    entry_subtitle_direct: 'Online e-visa for your passport',
    insurance_title: 'TRAVEL INSURANCE',
    insurance_subtitle: 'Coverage for your stay in Türkiye',
    esim_title: 'TURKEY eSIM',
    esim_subtitle: 'Mobile data for your trip',
  },
  category_lines: {
    entry_free: 'Visa free entry • insurance required',
    e_permit_direct: 'e-Visa + insurance required',
    e_permit_conditional: 'Valid Schengen / UK / USA permit required',
    age_special: 'Age-based rules apply',
    sticker_mission: 'No online e-visa • embassy sticker process',
    default: 'Insurance required',
  },
  country_card: {
    title_default: 'Get Your Travel E-VISA',
    for_citizens: 'for {country} Citizens',
    requirements_title: 'Travel Requirements for Turkey:',
    passport_validity_label: 'Passport validity',
    passport_validity_default: 'Minimum 180 days',
    max_stay_label: 'Maximum stay',
    max_stay_fallback: 'See details below',
    insurance_row_label: 'Insurance',
    insurance_required_label: 'Required',
    status_free: 'Visa free',
    status_direct: 'e-Visa required',
    status_other: 'E-visa required',
  },
  insurance: {
    title: 'Travel Health Insurance',
    features: [
      'Valid Coverage in Türkiye',
      'Instant Digital PDF Policy',
      'Covers Your Entire Stay',
    ],
    daily_label: 'Daily Rate · 1 Person',
    per_day_label: '/ day',
    important_title: 'Important Information',
    paragraphs: [
      'Under Law No. 6458, travel health insurance requirements may vary depending on your nationality, visa type, and length of stay. When required, your policy must cover your entire stay in Türkiye.',
      'Purchase your policy before travelling and keep a digital or printed copy with you.',
    ],
    important_note:
      'Important: Travel health insurance does not guarantee a visa or entry into Türkiye. The final decision rests with the relevant authorities.',
    cta_label: 'APPLY NOW',
  },
  esim_page: {
    headline: 'eSIM Packages Valid in Türkiye',
    body: 'Choose one of our eSIM packages to stay connected during your trip to Türkiye. Purchase and install your eSIM before arriving in Türkiye. Activate mobile data after you arrive.',
    bullets: [
      'Valid for use in Türkiye',
      'WhatsApp continues working with your existing number',
      'No physical SIM card required',
      'eSIM provides mobile connectivity only; it does not provide a visa or entry permission',
    ],
    choose_label: 'Choose Your Türkiye eSIM Package',
    unavailable: 'eSIM plans are currently unavailable.',
    details_label: 'Package details',
  },
};
