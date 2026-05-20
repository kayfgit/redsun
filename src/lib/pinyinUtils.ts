import { ALL_SYLLABLES, PINYIN_MAP, CHAR_INFO, PHRASE_DICT } from './pinyinData';

/**
 * Split a pinyin string into individual syllables using greedy longest-match.
 */
export function splitPinyin(input: string): string[] | null {
  const s = input.toLowerCase().trim();
  if (!s) return null;

  const result: string[] = [];
  let i = 0;

  while (i < s.length) {
    let matched = false;
    for (let len = Math.min(6, s.length - i); len >= 1; len--) {
      const candidate = s.slice(i, i + len);
      if (ALL_SYLLABLES.has(candidate)) {
        result.push(candidate);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) return null;
  }

  return result;
}

/**
 * Look up characters for a pinyin syllable.
 */
export function lookupPinyin(syllable: string): string[] {
  const entries = PINYIN_MAP[syllable.toLowerCase()];
  if (!entries) return [];
  return entries.map(([char]) => char);
}

/**
 * For single-syllable input: return individual character candidates.
 * For multi-syllable: return phrase candidates (e.g. "nihao" → ["你好", "你号", "泥好", ...]).
 */
export function getCandidates(input: string): string[] {
  const trimmed = input.toLowerCase().trim();
  if (!trimmed) return [];

  // Try as single syllable
  const direct = lookupPinyin(trimmed);
  if (direct.length > 0) return direct;

  // Try to split into multiple syllables → generate phrase candidates
  const syllables = splitPinyin(trimmed);
  if (syllables && syllables.length > 1) {
    return generatePhraseCandidates(syllables);
  }

  // Partial match: syllables that start with input
  const partial: string[] = [];
  for (const [syllable, entries] of Object.entries(PINYIN_MAP)) {
    if (syllable.startsWith(trimmed)) {
      partial.push(...entries.map(([char]) => char));
    }
  }
  return partial.slice(0, 12);
}

/**
 * Generate phrase candidates from multiple syllables.
 * Takes top characters for each syllable and creates combinations.
 * The first result uses the most common character for each syllable.
 * Subsequent results vary one syllable at a time.
 */
function generatePhraseCandidates(syllables: string[]): string[] {
  const charOptions = syllables.map((syl) => lookupPinyin(syl).slice(0, 4));

  // Can't generate if any syllable has no candidates
  if (charOptions.some((opts) => opts.length === 0)) return [];

  const results: string[] = [];
  const seen = new Set<string>();

  // First: most common character for each syllable
  const primary = charOptions.map((opts) => opts[0]).join('');
  results.push(primary);
  seen.add(primary);

  // Then: vary one syllable at a time to create alternatives
  for (let pos = 0; pos < syllables.length; pos++) {
    for (let alt = 1; alt < charOptions[pos].length; alt++) {
      const phrase = charOptions
        .map((opts, i) => (i === pos ? opts[alt] : opts[0]))
        .join('');
      if (!seen.has(phrase)) {
        results.push(phrase);
        seen.add(phrase);
      }
    }
  }

  return results.slice(0, 12);
}

/**
 * Resolve a phrase string (e.g. "你好") into PhraseEntry array.
 */
export function resolvePhrase(phrase: string): { char: string; pinyin: string; meaning: string }[] {
  return phrase.split('').map((char) => {
    const info = CHAR_INFO[char];
    return {
      char,
      pinyin: info?.pinyin || '?',
      meaning: info?.meaning || '?',
    };
  });
}

/**
 * Resolve a full pinyin input to characters.
 * Can optionally take a selected phrase to use instead of defaults.
 */
export function resolveInput(
  input: string,
  selectedPhrase?: string
): { char: string; pinyin: string; meaning: string }[] {
  const trimmed = input.toLowerCase().trim();
  if (!trimmed) return [];

  // If a specific phrase was selected, use it
  if (selectedPhrase) {
    return resolvePhrase(selectedPhrase);
  }

  // Chinese characters
  if (/^[\u4e00-\u9fff]+$/.test(trimmed)) {
    return resolvePhrase(trimmed);
  }

  // Single syllable
  const direct = PINYIN_MAP[trimmed];
  if (direct && direct.length > 0) {
    const [char, pinyin, meaning] = direct[0];
    return [{ char, pinyin, meaning }];
  }

  // Multi-syllable: use first (most common) character per syllable
  const syllables = splitPinyin(trimmed);
  if (!syllables) return [];

  return syllables.map((syl) => {
    const entries = PINYIN_MAP[syl];
    if (entries && entries.length > 0) {
      const [char, pinyin, meaning] = entries[0];
      return { char, pinyin, meaning };
    }
    return { char: '?', pinyin: syl, meaning: '?' };
  });
}

/**
 * Get a translation for accumulated phrase characters.
 * Tries to match known sub-phrases and fills gaps with individual meanings.
 */
export function getTranslation(chars: string[]): string {
  const phrase = chars.join('');

  // Exact match for full phrase
  if (PHRASE_DICT[phrase]) return PHRASE_DICT[phrase];

  // Greedy sub-phrase matching: walk through chars, match longest known phrase at each position
  const parts: string[] = [];
  let i = 0;
  while (i < chars.length) {
    let matched = false;
    for (let len = Math.min(4, chars.length - i); len >= 2; len--) {
      const sub = chars.slice(i, i + len).join('');
      if (PHRASE_DICT[sub]) {
        parts.push(PHRASE_DICT[sub]);
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Fall back to individual character meaning
      const info = CHAR_INFO[chars[i]];
      parts.push(info?.meaning || '?');
      i++;
    }
  }

  return parts.join(' ');
}
