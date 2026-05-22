'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { translateMeaning } from '@/lib/meaningTranslator';

/**
 * Resolve the localised form of an English meaning. Returns `null` until (and
 * unless) an on-device translation for the current language is ready.
 */
function useTranslatedMeaning(english: string): string | null {
  const { locale } = useLanguage();
  const key = `${locale}:${english}`;
  // Keyed so a result from a previous meaning/locale never bleeds through.
  const [entry, setEntry] = useState<{ key: string; value: string } | null>(
    null
  );

  useEffect(() => {
    if (locale === 'en' || !english || english === '?') return;
    let cancelled = false;
    translateMeaning(locale, english).then((result) => {
      if (!cancelled && result && result !== english) {
        setEntry({ key, value: result });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale, english, key]);

  return entry && entry.key === key ? entry.value : null;
}

interface MeaningProps {
  /** The English gloss from the dictionary. */
  text: string;
  className?: string;
}

/**
 * Renders a dictionary meaning. In English it shows the gloss as-is; in any
 * other language it shows the translation with the English kept alongside,
 * dimmed — e.g. "boca · mouth".
 */
export function Meaning({ text, className }: MeaningProps) {
  const translated = useTranslatedMeaning(text);

  if (!translated) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {translated}
      <span className="opacity-50"> · {text}</span>
    </span>
  );
}
