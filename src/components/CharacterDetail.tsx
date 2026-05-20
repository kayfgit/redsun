'use client';

import { CHAR_INFO } from '@/lib/pinyinData';

interface CharacterDetailProps {
  character: string;
  onBack: () => void;
}

export function CharacterDetail({ character, onBack }: CharacterDetailProps) {
  const info = CHAR_INFO[character];
  const pinyin = info?.pinyin || '?';
  const meaning = info?.meaning || '?';

  const handleCopy = () => {
    navigator.clipboard.writeText(character);
  };

  return (
    <div className="flex w-full max-w-[600px] flex-col items-center gap-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1.5 font-sans text-sm text-ink-light hover:text-ink transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Main character card */}
      <div
        className="flex w-full flex-col items-center gap-2 rounded-sm py-10"
        style={{
          backgroundColor: '#F8F3EB',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(26, 26, 26, 0.08)',
        }}
      >
        <span className="font-sans text-lg text-ink-light">{pinyin}</span>
        <div className="flex items-center gap-4">
          <span className="font-serif-cn text-[120px] leading-none text-ink">
            {character}
          </span>
          {/* Speaker placeholder */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-wash text-ink-light transition-colors hover:bg-ink/10 hover:text-ink"
            title="Play pronunciation (coming soon)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>
        <span className="font-sans text-base text-ink-light italic">{meaning}</span>
      </div>

      {/* Info sections */}
      <div className="grid w-full grid-cols-2 gap-4">
        {/* Pronunciation */}
        <div className="flex flex-col gap-2 rounded-sm bg-canvas-bg p-4" style={{ border: '1px solid rgba(26,26,26,0.06)' }}>
          <h3 className="font-sans text-xs font-medium uppercase tracking-widest text-ink-light">
            Pronunciation
          </h3>
          <p className="font-sans text-base text-ink">
            <span className="font-serif-cn text-lg">{pinyin}</span>
          </p>
          <p className="font-sans text-xs text-ink-light/60">
            Tone: {getToneDescription(pinyin)}
          </p>
        </div>

        {/* Writing */}
        <div className="flex flex-col gap-2 rounded-sm bg-canvas-bg p-4" style={{ border: '1px solid rgba(26,26,26,0.06)' }}>
          <h3 className="font-sans text-xs font-medium uppercase tracking-widest text-ink-light">
            Writing
          </h3>
          <p className="font-serif-cn text-4xl text-ink/20 text-center py-1">
            {character}
          </p>
          <p className="font-sans text-xs text-ink-light/60 text-center">
            Stroke order animation coming soon
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-full border border-ink/10 px-4 py-2 font-sans text-sm text-ink-light transition-colors hover:border-ink/20 hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          Copy
        </button>
      </div>
    </div>
  );
}

function getToneDescription(pinyin: string): string {
  if (/[āēīōūǖ]/.test(pinyin)) return '1st tone (flat)';
  if (/[áéíóúǘ]/.test(pinyin)) return '2nd tone (rising)';
  if (/[ǎěǐǒǔǚ]/.test(pinyin)) return '3rd tone (dipping)';
  if (/[àèìòùǜ]/.test(pinyin)) return '4th tone (falling)';
  return 'Neutral tone';
}
