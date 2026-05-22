/**
 * Translates English dictionary glosses into the active UI language using the
 * browser's built-in on-device Translator API (Chrome/Edge 138+).
 *
 * It is a progressive enhancement: when the API is missing or a language pair
 * is unavailable, `translateMeaning` resolves to `null` and callers fall back
 * to the original English. Pinyin is never touched.
 */

import type { Locale } from './i18n';

// BCP-47 target tags for the Translator API (it wants a script for Chinese).
const TARGET_LANG: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-Hans',
  hi: 'hi',
  es: 'es',
  fr: 'fr',
  pt: 'pt',
  ja: 'ja',
  ar: 'ar',
  ru: 'ru',
  de: 'de',
};

interface TranslatorInstance {
  translate(text: string): Promise<string>;
}

interface TranslatorAPI {
  availability(opts: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
  create(opts: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<TranslatorInstance>;
}

function getTranslatorAPI(): TranslatorAPI | undefined {
  return (globalThis as unknown as { Translator?: TranslatorAPI }).Translator;
}

/** True when the browser exposes the on-device Translator API at all. */
export function isMeaningTranslationSupported(): boolean {
  return getTranslatorAPI() !== undefined;
}

// One translator instance per target locale, created lazily and reused.
const translators = new Map<Locale, Promise<TranslatorInstance | null>>();
// Per-locale memo of english gloss → translated string, so a meaning shared by
// many characters (e.g. "happy") is only sent to the model once.
const caches = new Map<Locale, Map<string, string>>();

function cacheFor(locale: Locale): Map<string, string> {
  let cache = caches.get(locale);
  if (!cache) {
    cache = new Map();
    caches.set(locale, cache);
  }
  return cache;
}

async function createTranslator(
  locale: Locale
): Promise<TranslatorInstance | null> {
  const api = getTranslatorAPI();
  if (!api) return null;

  const opts = { sourceLanguage: 'en', targetLanguage: TARGET_LANG[locale] };
  try {
    const availability = await api.availability(opts);
    if (availability === 'unavailable') return null;
    // `create` downloads the language model on first use if needed.
    return await api.create(opts);
  } catch {
    return null;
  }
}

function getTranslator(locale: Locale): Promise<TranslatorInstance | null> {
  let translator = translators.get(locale);
  if (!translator) {
    translator = createTranslator(locale);
    translators.set(locale, translator);
  }
  return translator;
}

/**
 * Translate one English meaning into `locale`. Resolves to `null` when
 * on-device translation is unavailable so the caller can keep the English.
 *
 * Glosses are compound: " · " joins several senses and "/" joins disambiguation
 * variants (e.g. "down · summer", "day/sun"). Each atom is translated on its
 * own and the separators are preserved, which keeps the result readable.
 */
export async function translateMeaning(
  locale: Locale,
  english: string
): Promise<string | null> {
  if (locale === 'en') return english;

  const trimmed = english.trim();
  if (!trimmed || trimmed === '?') return null;

  const cache = cacheFor(locale);
  const cached = cache.get(english);
  if (cached !== undefined) return cached;

  const translator = await getTranslator(locale);
  if (!translator) return null;

  try {
    const senses = await Promise.all(
      trimmed.split('·').map(async (sense) => {
        const variants = await Promise.all(
          sense
            .split('/')
            .map((v) => v.trim())
            .filter(Boolean)
            .map((v) => translator.translate(v))
        );
        return variants.join('/');
      })
    );
    const result = senses.join(' · ');
    cache.set(english, result);
    return result;
  } catch {
    return null;
  }
}
