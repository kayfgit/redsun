/**
 * Builds the Redsun dictionary from open datasets.
 *
 * Sources (downloaded into ./.data — gitignored):
 *   - HSK 3.0 vocabulary: drkameleon/complete-hsk-vocabulary (complete.json)
 *   - CC-CEDICT: mdbg.net (cedict.txt) — CC-BY-SA 4.0
 *   - scripts/seed-phrases.json — hand-curated phrases HSK omits (e.g. greetings)
 *
 * The character set is every hanzi that appears in any HSK word (~3,000).
 *
 * Pinyin strategy: a character's reading is taken from the words it appears in
 * — the per-syllable transcription of each HSK word — choosing whichever
 * reading is most common across those words. (HSK's standalone single-character
 * entries are NOT trusted: many are surname-only, e.g. 任/加/钟.) CC-CEDICT
 * then supplies a gloss matched to that reading.
 *
 * Run with:  npm run build-dictionary
 * Then run:  npm run generate-audio   (to voice the new entries)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DATA = path.join(ROOT, '.data');
const OUT = path.join(ROOT, 'src/lib/dictionary.generated.ts');

const isHan = (c: string) => /[㐀-鿿]/.test(c);
const allHan = (s: string) => [...s].every(isHan);

// ── Pinyin helpers ──────────────────────────────────────────────────────────

const TONE_MARKS: Record<string, string> = {
  a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè', i: 'īíǐì', u: 'ūúǔù', 'ü': 'ǖǘǚǜ',
};

/** Convert a numeric-tone syllable ("yao1", "lu:e4", "de5") to tone-marked form. */
function toned(token: string): string {
  const tok = token.toLowerCase().trim().replace(/u:/g, 'ü').replace(/v/g, 'ü');
  const m = tok.match(/^([a-zü]+)([0-5])$/);
  if (!m) return tok.replace(/[0-5]/g, '');
  const base = m[1];
  const tone = Number(m[2]);
  if (tone === 0 || tone === 5) return base; // neutral — no mark

  let idx = -1;
  for (const v of ['a', 'o', 'e']) {
    if (base.includes(v)) { idx = base.indexOf(v); break; }
  }
  if (idx < 0) {
    for (let i = base.length - 1; i >= 0; i--) {
      if ('iuü'.includes(base[i])) { idx = i; break; }
    }
  }
  if (idx < 0) return base;
  const marked = TONE_MARKS[base[idx]]?.[tone - 1] ?? base[idx];
  return base.slice(0, idx) + marked + base.slice(idx + 1);
}

/**
 * Strip tones from a marked syllable to get the lookup key ("ài" → "ai",
 * "nǚ" → "nv"). Only the four tone diacritics are removed — the diaeresis on
 * ü is kept and folded to "v", matching the app's pinyin input normalisation.
 */
function toneless(syllable: string): string {
  return syllable
    .normalize('NFD')
    .replace(/[̀́̄̌]/g, '') // grave, acute, macron, caron
    .normalize('NFC')
    .replace(/ü/g, 'v')
    .toLowerCase();
}

/** Trim a verbose dictionary definition down to a short, single-sense gloss. */
function terse(meaning: string, max = 48): string {
  let s = meaning
    .trim()
    .replace(/^\([^)]*\)\s*/, '')   // drop a leading qualifier like "(literary) "
    .split(/\s*;\s*/)[0]
    .trim();
  if (s.length > max) {
    const cut = s.slice(0, max);
    const sp = cut.lastIndexOf(' ');
    s = (sp > 12 ? cut.slice(0, sp) : cut) + '…';
  }
  return s || meaning.trim();
}

/** Pick the most learner-friendly gloss, skipping cross-references and names. */
function pickGloss(meanings: string[]): string {
  const skip = /^(\([^)]*\)\s*)?(variant of|old variant|surname |used in|abbr\. for)/i;
  const usable = meanings.map((m) => (m ?? '').trim()).filter(Boolean);
  return terse((usable.find((m) => !skip.test(m)) ?? usable[0] ?? '?').toString());
}

// ── Load sources ────────────────────────────────────────────────────────────

interface HskEntry {
  simplified: string;
  frequency: number;
  forms: { transcriptions: { numeric: string }; meanings: string[] }[];
}

const hsk: HskEntry[] = JSON.parse(
  await readFile(path.join(DATA, 'complete.json'), 'utf8'),
);
const cedictRaw = await readFile(path.join(DATA, 'cedict.txt'), 'utf8');
const seed: { phrases: Record<string, string> } = JSON.parse(
  await readFile(path.join(ROOT, 'scripts/seed-phrases.json'), 'utf8'),
);

// CC-CEDICT: index single-character entries → readings with glosses.
// `proper` flags surname/place readings; `weak` flags cross-reference glosses
// ("used in …", "variant of …") that carry no real meaning.
interface CedictReading { toned: string; key: string; gloss: string; proper: boolean; weak: boolean }
const cedictChar = new Map<string, CedictReading[]>();
for (const line of cedictRaw.split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const m = line.match(/^\S+ (\S+) \[([^\]]+)\] \/(.+)\/\s*$/);
  if (!m) continue;
  const [, simp, pinyin, defs] = m;
  if ([...simp].length !== 1 || !isHan(simp)) continue;
  const token = pinyin.split(/\s+/)[0];
  const py = toned(token);
  const gloss = pickGloss(defs.split('/'));
  const list = cedictChar.get(simp) ?? [];
  list.push({
    toned: py,
    key: toneless(py),
    gloss,
    proper: /^[A-Z]/.test(token),
    weak: /^(used in|variant|see )/i.test(gloss),
  });
  cedictChar.set(simp, list);
}

/** Best CC-CEDICT gloss for a character at a given (tone-marked) reading. */
function cedictGloss(char: string, py: string): string | null {
  const list = cedictChar.get(char);
  if (!list || list.length === 0) return null;
  const key = toneless(py);
  // Lower score = better: exact tone beats same syllable beats any reading;
  // real meanings beat proper nouns beat cross-reference placeholders.
  const score = (r: CedictReading) =>
    (r.toned === py ? 0 : r.key === key ? 4 : 8) + (r.proper ? 2 : 0) + (r.weak ? 1 : 0);
  return [...list].sort((a, b) => score(a) - score(b))[0].gloss;
}

// HSK: hanzi frequency ranks, single-char gloss fallback, and — for every
// hanzi — the readings observed across multi-character words.
const charFreq = new Map<string, number>();
const hskGloss = new Map<string, string>();
const wordMeaning = new Map<string, string>();
// char → tonelessKey → tonedForm → occurrence count
const wordReadings = new Map<string, Map<string, Map<string, number>>>();

for (const e of hsk) {
  if (!e.simplified || !allHan(e.simplified)) continue;
  const chars = [...e.simplified];
  for (const c of chars) {
    charFreq.set(c, Math.min(charFreq.get(c) ?? Infinity, e.frequency));
  }
  const f = e.forms[0];
  if (!wordMeaning.has(e.simplified)) {
    wordMeaning.set(e.simplified, pickGloss(f.meanings));
  }
  if (chars.length === 1) {
    if (!hskGloss.has(e.simplified)) hskGloss.set(e.simplified, pickGloss(f.meanings));
  } else {
    const tokens = f.transcriptions.numeric.trim().split(/\s+/);
    if (tokens.length !== chars.length) continue;
    for (let i = 0; i < chars.length; i++) {
      const py = toned(tokens[i]);
      const key = toneless(py);
      if (!key) continue;
      let byKey = wordReadings.get(chars[i]);
      if (!byKey) { byKey = new Map(); wordReadings.set(chars[i], byKey); }
      const byToned = byKey.get(key) ?? new Map<string, number>();
      byToned.set(py, (byToned.get(py) ?? 0) + 1);
      byKey.set(key, byToned);
    }
  }
}

/**
 * Many bound characters (e.g. 葡, 萄) have no standalone meaning — CC-CEDICT
 * glosses them as "used in 葡萄[…]". Resolve those to the compound's meaning.
 */
function improveGloss(gloss: string): string {
  if (!/^(used in|see |variant of)/i.test(gloss)) return gloss;
  for (const word of gloss.match(/[㐀-鿿]+/g) ?? []) {
    if (word.length >= 2 && wordMeaning.has(word)) return wordMeaning.get(word)!;
  }
  return gloss;
}

// ── Resolve every character to its reading(s) ───────────────────────────────

type CharEntry = [string, string, string];
const pinyinMap = new Map<string, CharEntry[]>();
const charInfo = new Map<string, { pinyin: string; meaning: string }>();
let viaWord = 0, viaCedict = 0, viaNone = 0;

const orderedChars = [...charFreq.keys()].sort(
  (a, b) => charFreq.get(a)! - charFreq.get(b)!,
);

for (const char of orderedChars) {
  // readings[0] is the character's primary (most common) reading.
  let readings: { key: string; toned: string; gloss: string }[] = [];

  const byKey = wordReadings.get(char);
  if (byKey) {
    // Rank readings by how often they occur across words; within a reading,
    // keep the most frequent tone-marked form.
    const ranked = [...byKey.entries()]
      .map(([key, tones]) => {
        const total = [...tones.values()].reduce((s, n) => s + n, 0);
        const py = [...tones.entries()].sort((a, b) => b[1] - a[1])[0][0];
        return { key, toned: py, total };
      })
      .sort((a, b) => b.total - a.total);
    readings = ranked.map((r) => ({
      key: r.key,
      toned: r.toned,
      gloss: improveGloss(cedictGloss(char, r.toned) ?? hskGloss.get(char) ?? '?'),
    }));
    viaWord++;
  } else if (cedictChar.has(char)) {
    // Character never appears inside a multi-char word — fall back to CC-CEDICT.
    for (const r of [...cedictChar.get(char)!].sort((a, b) => Number(a.proper) - Number(b.proper))) {
      readings.push({ key: r.key, toned: r.toned, gloss: improveGloss(r.gloss) });
    }
    viaCedict++;
  } else {
    viaNone++;
  }

  const seen = new Set<string>();
  for (const r of readings) {
    if (!r.key || seen.has(r.key)) continue;
    seen.add(r.key);
    const entries = pinyinMap.get(r.key) ?? [];
    entries.push([char, r.toned, r.gloss]);
    pinyinMap.set(r.key, entries);
  }
  if (readings[0]) {
    charInfo.set(char, { pinyin: readings[0].toned, meaning: readings[0].gloss });
  }
}

// Order characters within each syllable by frequency (most common first).
for (const entries of pinyinMap.values()) {
  entries.sort(
    (a, b) => (charFreq.get(a[0]) ?? Infinity) - (charFreq.get(b[0]) ?? Infinity),
  );
}

// ── Build PHRASE_DICT (seed phrases first, then HSK words by frequency) ──────

const phraseDict = new Map<string, string>();
for (const [phrase, meaning] of Object.entries(seed.phrases)) {
  phraseDict.set(phrase, meaning);
}
for (const e of [...hsk].sort((a, b) => a.frequency - b.frequency)) {
  if ([...e.simplified].length < 2 || !allHan(e.simplified)) continue;
  if (phraseDict.has(e.simplified)) continue;
  phraseDict.set(e.simplified, terse(e.forms[0].meanings[0] ?? '?', 60));
}

// ── Emit the generated module ───────────────────────────────────────────────

const sortedSyllables = [...pinyinMap.keys()].sort();
const mapBody = sortedSyllables
  .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(pinyinMap.get(k))},`)
  .join('\n');
const infoBody = orderedChars
  .filter((c) => charInfo.has(c))
  .map((c) => `  ${JSON.stringify(c)}: ${JSON.stringify(charInfo.get(c))},`)
  .join('\n');
const phraseBody = [...phraseDict.entries()]
  .map(([p, m]) => `  ${JSON.stringify(p)}: ${JSON.stringify(m)},`)
  .join('\n');

const out = `// AUTO-GENERATED by scripts/build-dictionary.mts — do not edit by hand.
//
// Dictionary data derived from:
//   - HSK 3.0 vocabulary — github.com/drkameleon/complete-hsk-vocabulary
//   - CC-CEDICT — mdbg.net/chinese/dictionary?page=cc-cedict (CC-BY-SA 4.0)
//
// ${charInfo.size} characters · ${phraseDict.size} phrases.
// Regenerate with: npm run build-dictionary

export type CharEntry = [character: string, pinyin: string, meaning: string];

/** Toneless pinyin syllable → characters with that reading (most common first). */
export const PINYIN_MAP: Record<string, CharEntry[]> = {
${mapBody}
};

/** Character → its primary reading and gloss. */
export const CHAR_INFO: Record<string, { pinyin: string; meaning: string }> = {
${infoBody}
};

/** Multi-character word → English meaning. */
export const PHRASE_DICT: Record<string, string> = {
${phraseBody}
};
`;

await writeFile(OUT, out, 'utf8');

console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log(`  characters : ${charInfo.size}`);
console.log(`  syllables  : ${sortedSyllables.length}`);
console.log(`  phrases    : ${phraseDict.size}`);
console.log(`  readings   : ${viaWord} from HSK words, ${viaCedict} from CC-CEDICT, ${viaNone} unresolved`);
