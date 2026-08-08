import { LANG_OPTIONS, STORAGE_KEY, type LangCode } from './types';

const SUPPORTED = new Set<string>(LANG_OPTIONS.map((l) => l.code));

/** Map browser tags like ar-SA, tr-TR, zh-CN → supported LangCode or null */
export function matchBrowserLang(tag: string | undefined | null): LangCode | null {
  if (!tag) return null;
  const primary = tag.toLowerCase().split('-')[0];
  if (SUPPORTED.has(primary)) return primary as LangCode;
  return null;
}

export function detectBrowserLang(): LangCode {
  try {
    const list =
      typeof navigator !== 'undefined'
        ? navigator.languages?.length
          ? [...navigator.languages]
          : navigator.language
            ? [navigator.language]
            : []
        : [];
    for (const tag of list) {
      const hit = matchBrowserLang(tag);
      if (hit) return hit;
    }
  } catch {
    /* ignore */
  }
  return 'en';
}

/** localStorage if valid, else browser language, else English */
export function resolveInitialLang(): LangCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.has(stored)) return stored as LangCode;
  } catch {
    /* ignore */
  }
  return detectBrowserLang();
}

export function persistLang(lang: LangCode) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}
