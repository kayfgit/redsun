'use client';

import { getTranslation } from '@/lib/pinyinUtils';
import { useLanguage } from './LanguageProvider';
import { Meaning } from './Meaning';

interface PhraseEntry {
  char: string;
  pinyin: string;
  meaning: string;
}

interface PhraseBuilderProps {
  entries: PhraseEntry[];
  onClear: () => void;
}

export function PhraseBuilder({ entries, onClear }: PhraseBuilderProps) {
  const { t } = useLanguage();
  if (entries.length === 0) return null;

  const chars = entries.map((e) => e.char);
  const translation = getTranslation(chars);

  return (
    <div className="flex w-full max-w-5xl items-start gap-6 rounded-sm border border-ink/8 bg-canvas-bg px-6 py-5">
      {/* Characters with pinyin on top */}
      <div className="flex flex-wrap items-end gap-1">
        {entries.map((entry, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="font-sans text-xs text-ink-light">{entry.pinyin}</span>
            <span className="font-serif-cn text-3xl text-ink">{entry.char}</span>
          </div>
        ))}
      </div>

      {/* Translation */}
      <div className="flex flex-1 items-center self-center">
        <Meaning
          text={translation}
          className="font-sans text-base text-ink-light italic"
        />
      </div>

      {/* Clear button */}
      <button
        onClick={onClear}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-ink-light/40 transition-colors hover:bg-ink-wash hover:text-ink-light self-center"
        title={t('action.clearPhrase')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
