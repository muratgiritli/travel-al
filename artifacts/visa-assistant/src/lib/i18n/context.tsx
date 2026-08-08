import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { persistLang, resolveInitialLang } from './detect';
import { translate } from './messages';
import { isRtl, LANG_OPTIONS, type LangCode } from './types';

type I18nCtx = {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  options: typeof LANG_OPTIONS;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => resolveInitialLang());

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    persistLang(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      dir: (isRtl(lang) ? 'rtl' : 'ltr') as 'ltr' | 'rtl',
      options: LANG_OPTIONS,
    }),
    [lang, setLang, t],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Safe fallback when used outside provider (e.g. early tests)
    return {
      lang: 'en',
      setLang: () => undefined,
      t: (key, vars) => translate('en', key, vars),
      dir: 'ltr',
      options: LANG_OPTIONS,
    };
  }
  return ctx;
}
