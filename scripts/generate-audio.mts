/**
 * Pre-generates pronunciation audio for every character and phrase in the
 * dictionary, so the app never depends on an OS Mandarin language pack.
 *
 * Uses Microsoft Edge's online neural TTS (free, no API key). Run with:
 *   pnpm generate-audio
 *
 * It is resumable — already-generated files are skipped — so it is safe to
 * re-run after interruption or when the dictionary grows.
 */
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { CHAR_INFO, PHRASE_DICT } from '../src/lib/pinyinData.ts';
import { audioName } from '../src/lib/audioName.ts';

const OUT_DIR = path.resolve(fileURLToPath(import.meta.url), '../../public/audio');
const VOICE = 'zh-CN-XiaoxiaoNeural';
const CONCURRENCY = 6;

/** Synthesises one piece of text to an MP3 buffer via a fresh TTS connection. */
async function synth(text: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  audioStream.on('data', (c: Buffer) => chunks.push(c));
  await new Promise<void>((resolve, reject) => {
    audioStream.on('end', () => resolve());
    audioStream.on('error', reject);
  });
  try {
    tts.close();
  } catch {
    /* connection already closed */
  }
  return Buffer.concat(chunks);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const existing = new Set(await readdir(OUT_DIR));

  // Single characters plus the canned phrases — both get spoken in the UI.
  const targets = [...Object.keys(CHAR_INFO), ...Object.keys(PHRASE_DICT)];
  const todo = targets.filter((t) => !existing.has(`${audioName(t)}.mp3`));
  console.log(`${targets.length} entries total — ${todo.length} to generate.`);

  let done = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < todo.length) {
      const text = todo[cursor++];
      try {
        const buf = await synth(text);
        await writeFile(path.join(OUT_DIR, `${audioName(text)}.mp3`), buf);
      } catch (err) {
        failed++;
        console.warn(`  ✗ ${text}: ${(err as Error).message}`);
      }
      done++;
      if (done % 50 === 0) console.log(`  ${done}/${todo.length}`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Done — ${done - failed} written, ${failed} failed.`);
  if (failed > 0) console.log('Re-run to retry the failures.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
