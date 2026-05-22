'use client';

import { CharacterButton } from './CharacterButton';

interface SimilarCharactersProps {
  characters: string[];
  selectedChar: string | null;
  highlightIndex?: number;
  onSelect: (char: string) => void;
  isLoading?: boolean;
  title?: string;
  /** Message shown when there are no matches yet. */
  emptyHint?: string;
}

export function SimilarCharacters({
  characters,
  selectedChar,
  highlightIndex = -1,
  onSelect,
  isLoading = false,
  title,
  emptyHint = 'Draw a character to see matches',
}: SimilarCharactersProps) {
  // Detect if items are phrases (multi-char) or single characters
  const isPhrase = characters.length > 0 && characters[0].length > 1;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-sans text-sm font-medium uppercase tracking-widest text-ink-light">
        {title || (isPhrase ? 'Phrase Candidates' : 'Similar Characters')}
      </h2>

      {characters.length === 0 && !isLoading ? (
        <p className="py-12 text-center font-sans text-base text-ink-light/60">
          {emptyHint}
        </p>
      ) : isLoading ? (
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] w-[72px] animate-pulse rounded-sm bg-ink-wash"
            />
          ))}
        </div>
      ) : isPhrase ? (
        <div className="flex flex-col gap-2">
          {characters.map((phrase, i) => (
            <button
              key={`${phrase}-${i}`}
              onClick={() => onSelect(phrase)}
              className={`
                flex items-center gap-2 rounded-sm px-4 py-3 text-left
                font-serif-cn text-2xl transition-all duration-150
                ${
                  i === highlightIndex
                    ? 'bg-ink/5 ring-2 ring-ink/30'
                    : selectedChar === phrase
                      ? 'bg-seal-red/10 ring-1 ring-seal-red/40'
                      : 'bg-rice-paper hover:bg-rice-paper-dark'
                }
              `}
              style={{
                boxShadow: i === highlightIndex || selectedChar === phrase
                  ? 'none'
                  : '0 1px 2px rgba(26, 26, 26, 0.04)',
              }}
            >
              {phrase.split('').map((char, ci) => (
                <span key={ci} className="text-ink">{char}</span>
              ))}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5">
          {characters.map((char, i) => (
            <CharacterButton
              key={`${char}-${i}`}
              character={char}
              isSelected={selectedChar === char}
              isHighlighted={i === highlightIndex}
              onClick={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
