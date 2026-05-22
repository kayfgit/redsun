/**
 * Dictionary data access layer.
 *
 * The raw dictionary — PINYIN_MAP (syllable → characters), CHAR_INFO
 * (character → reading + gloss) and PHRASE_DICT (word → meaning) — is
 * generated from HSK 3.0 vocabulary + CC-CEDICT by `scripts/build-dictionary.mts`
 * and lives in `dictionary.generated.ts`. Regenerate it with:
 *
 *   npm run build-dictionary
 *
 * This module re-exports that data and derives the syllable set used when
 * parsing typed pinyin. Nothing here should be hand-edited to add entries —
 * change the source datasets / seed file and rebuild instead.
 */
import { PINYIN_MAP, CHAR_INFO, PHRASE_DICT } from './dictionary.generated';

export { PINYIN_MAP, CHAR_INFO, PHRASE_DICT };
export type { CharEntry } from './dictionary.generated';

// Every valid toneless pinyin syllable — used to split a typed pinyin string.
export const ALL_SYLLABLES = new Set(Object.keys(PINYIN_MAP));
