export type LangCode = 'en' | 'ar' | 'es' | 'de' | 'tr' | 'fr' | 'ru';

export const LANG_OPTIONS: { code: LangCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'EN' },
  { code: 'ar', label: 'العربية', native: 'AR' },
  { code: 'tr', label: 'Türkçe', native: 'TR' },
  { code: 'es', label: 'Español', native: 'ES' },
  { code: 'de', label: 'Deutsch', native: 'DE' },
  { code: 'fr', label: 'Français', native: 'FR' },
  { code: 'ru', label: 'Русский', native: 'RU' },
];

export const RTL_LANGS: LangCode[] = ['ar'];

export function isRtl(lang: LangCode): boolean {
  return RTL_LANGS.includes(lang);
}

export const STORAGE_KEY = 'teg_lang';
