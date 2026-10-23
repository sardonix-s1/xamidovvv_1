import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_LANG, LANGS, type Lang, type Localized } from '../config/site';
import { en, type Dictionary } from './en';
import { ru } from './ru';

const DICTIONARIES: Record<Lang, Dictionary> = { en, ru };
const STORAGE_KEY = 'xamidovvv:lang';

interface I18nValue {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
  /** Pick the current language from a { en, ru } object. */
  pick: <T>(value: Localized<T>) => T;
  /** Replace {placeholders} in a string. */
  fmt: (template: string, values: Record<string, string>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

function readStoredLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* storage can be unavailable (private mode, blocked cookies) */
  }
  return DEFAULT_LANG;
}

function setMeta(selector: string, content: string): void {
  document.head.querySelector(selector)?.setAttribute('content', content);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);
  const t = DICTIONARIES[lang];

  // Keep <html lang>, title and metadata in sync with the selected language.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.meta.title;
    setMeta('meta[name="description"]', t.meta.description);
    setMeta('meta[property="og:title"]', t.meta.title);
    setMeta('meta[property="og:description"]', t.meta.description);
    setMeta('meta[property="og:locale"]', t.meta.locale);
  }, [lang, t]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* non-fatal: the choice just won't persist */
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      t,
      setLang,
      pick: (localized) => localized[lang],
      fmt: (template, values) =>
        template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match),
    }),
    [lang, t, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
