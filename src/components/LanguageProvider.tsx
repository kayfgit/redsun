'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  translations,
  type Locale,
  type TranslationKey,
} from '@/lib/i18n';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a key into the active locale (falls back to English). */
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'redsun:locale';

function isLocale(value: string | null): value is Locale {
  return value != null && LOCALES.some((l) => l.code === value);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always start from the default so server and first client render agree;
  // the saved choice is applied in an effect right after mount.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      /* localStorage unavailable — keep the default */
    }
  }, []);

  // Keep <html lang> and text direction in sync with the chosen language.
  useEffect(() => {
    const meta = LOCALES.find((l) => l.code === locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = meta?.dir ?? 'ltr';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* persistence is best-effort */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) =>
      translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key,
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
