'use client';

import { useEffect } from 'react';
import { CHAR_INFO } from '@/lib/pinyinData';
import { findExamplePhrases, findHomophones } from '@/lib/pinyinUtils';
import { useCopy } from '@/hooks/useCopy';
import { PronounceButton } from './PronounceButton';

/** Clipboard / checkmark glyph, swapped when a copy succeeds. */
function CopyGlyph({ copied }: { copied: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {copied ? (
        <path d="M20 6 9 17l-5-5" />
      ) : (
        <>
          <rect width="14" height="14" x="8" y="8" rx="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </>
      )}
    </svg>
  );
}

interface CharacterModalProps {
  character: string;
  onClose: () => void;
}

export function CharacterModal({ character, onClose }: CharacterModalProps) {
  const isPhrase = character.length > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4 py-8 animate-fadein"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-sm bg-rice-paper shadow-2xl animate-slidein"
        style={{
          border: '1px solid rgba(26, 26, 26, 0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25), inset 0 0 80px rgba(0,0,0,0.02)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-ink/10 hover:text-ink"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 py-8 sm:px-12 sm:py-10">
          {isPhrase ? <PhraseView phrase={character} /> : <CharView character={character} />}
        </div>
      </div>
    </div>
  );
}

// ── Single character view ──

function CharView({ character }: { character: string }) {
  const info = CHAR_INFO[character];
  const pinyin = info?.pinyin || '?';
  const meaning = info?.meaning || '?';
  const tone = getTone(pinyin);

  const examples = findExamplePhrases(character, 4);
  const homophones = findHomophones(character, 8);

  const { copied, copy } = useCopy();

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col items-center gap-2">
        <span
          className="font-sans text-2xl tracking-wide"
          style={{ color: TONE_COLORS[tone.id] }}
        >
          {pinyin}
        </span>

        <div className="flex items-center gap-4">
          <span className="font-serif-cn text-[120px] sm:text-[132px] leading-none text-ink">
            {character}
          </span>
          <div className="flex flex-col gap-2">
            <PronounceButton text={character} iconSize={18} className="h-10 w-10" />
            <button
              onClick={() => copy(character)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                copied
                  ? 'bg-seal-red/10 text-seal-red'
                  : 'bg-ink-wash text-ink-light hover:bg-ink/10 hover:text-ink'
              }`}
              title={copied ? 'Copied!' : 'Copy character'}
              aria-label="Copy character"
            >
              <CopyGlyph copied={copied} />
            </button>
          </div>
        </div>

        <span className="font-sans text-base italic text-ink-light">{meaning}</span>

        <div className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-widest text-ink-light/60">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: TONE_COLORS[tone.id] }}
          />
          {tone.label}
        </div>
      </div>

      <div className="ink-wash-divider" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Stroke order placeholder */}
        <Section title="Stroke order">
          <div
            className="flex aspect-square w-full max-w-[160px] mx-auto items-center justify-center rounded-sm"
            style={{
              backgroundColor: '#F8F3EB',
              border: '1px dashed rgba(26,26,26,0.15)',
            }}
          >
            <span className="font-serif-cn text-[96px] leading-none text-ink/25">
              {character}
            </span>
          </div>
          <p className="mt-2 text-center font-sans text-[11px] text-ink-light/60">
            Animated stroke order coming soon
          </p>
        </Section>

        {/* Example phrases */}
        <Section title="In a phrase">
          {examples.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {examples.map((ex) => (
                <li
                  key={ex.phrase}
                  className="flex flex-col gap-0.5 rounded-sm bg-canvas-bg px-3 py-2"
                  style={{ border: '1px solid rgba(26,26,26,0.06)' }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif-cn text-2xl text-ink">
                      {ex.phrase.split('').map((c, i) => (
                        <span
                          key={i}
                          className={c === character ? 'text-seal-red' : ''}
                        >
                          {c}
                        </span>
                      ))}
                    </span>
                    <span className="font-sans text-xs italic text-ink-light">
                      {ex.meaning}
                    </span>
                  </div>
                  <span className="font-sans text-[11px] tracking-wide text-ink-light/70">
                    {ex.pinyin}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center font-sans text-sm text-ink-light/60 py-4">
              No example phrases yet.
            </p>
          )}
        </Section>
      </div>

      {/* Homophones */}
      {homophones.length > 0 && (
        <Section title={`Same pinyin (${stripTone(pinyin)})`}>
          <div className="flex flex-wrap gap-2">
            {homophones.map((c) => {
              const ci = CHAR_INFO[c];
              return (
                <div
                  key={c}
                  className="flex items-center gap-2 rounded-sm bg-canvas-bg px-3 py-1.5"
                  style={{ border: '1px solid rgba(26,26,26,0.06)' }}
                  title={ci ? `${ci.pinyin} — ${ci.meaning}` : c}
                >
                  <span className="font-serif-cn text-xl text-ink">{c}</span>
                  <span className="font-sans text-xs text-ink-light/70">
                    {ci?.meaning || '?'}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Multi-char phrase view ──

function PhraseView({ phrase }: { phrase: string }) {
  const chars = phrase.split('');
  const pinyinJoined = chars.map((c) => CHAR_INFO[c]?.pinyin || c).join(' ');
  const meaningJoined = chars
    .map((c) => CHAR_INFO[c]?.meaning || '?')
    .join(' · ');

  const { copied, copy } = useCopy();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="font-sans text-xl tracking-wide text-ink-light">
          {pinyinJoined}
        </span>
        <div className="flex items-center gap-4">
          <span className="font-serif-cn text-[88px] sm:text-[100px] leading-none text-ink">
            {phrase}
          </span>
          <button
            onClick={() => copy(phrase)}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              copied
                ? 'bg-seal-red/10 text-seal-red'
                : 'bg-ink-wash text-ink-light hover:bg-ink/10 hover:text-ink'
            }`}
            title={copied ? 'Copied!' : 'Copy phrase'}
            aria-label="Copy phrase"
          >
            <CopyGlyph copied={copied} />
          </button>
        </div>
        <span className="font-sans text-base italic text-ink-light">
          {meaningJoined}
        </span>
      </div>

      <div className="ink-wash-divider" />

      <Section title="Characters">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {chars.map((c, i) => {
            const ci = CHAR_INFO[c];
            return (
              <div
                key={`${c}-${i}`}
                className="flex items-center gap-3 rounded-sm bg-canvas-bg px-3 py-2"
                style={{ border: '1px solid rgba(26,26,26,0.06)' }}
              >
                <span className="font-serif-cn text-4xl text-ink">{c}</span>
                <div className="flex flex-col">
                  <span className="font-sans text-sm text-ink">
                    {ci?.pinyin || '?'}
                  </span>
                  <span className="font-sans text-xs italic text-ink-light">
                    {ci?.meaning || '?'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ── Helpers ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-sans text-xs font-medium uppercase tracking-widest text-ink-light">
        {title}
      </h3>
      {children}
    </section>
  );
}

const TONE_COLORS: Record<number, string> = {
  1: '#C04A2B',  // ink-red, flat
  2: '#B8862F',  // ochre, rising
  3: '#3D6E3D',  // moss, dipping
  4: '#3B5A8C',  // indigo, falling
  0: '#7A736C',  // muted, neutral
};

function getTone(pinyin: string): { id: number; label: string } {
  if (/[āēīōūǖ]/.test(pinyin)) return { id: 1, label: '1st tone · flat' };
  if (/[áéíóúǘ]/.test(pinyin)) return { id: 2, label: '2nd tone · rising' };
  if (/[ǎěǐǒǔǚ]/.test(pinyin)) return { id: 3, label: '3rd tone · dipping' };
  if (/[àèìòùǜ]/.test(pinyin)) return { id: 4, label: '4th tone · falling' };
  return { id: 0, label: 'neutral tone' };
}

function stripTone(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ü/g, 'ü');
}
