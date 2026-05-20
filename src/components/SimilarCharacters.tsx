'use client';

import { CharacterButton } from './CharacterButton';

interface SimilarCharactersProps {
  characters: string[];
  selectedChar: string | null;
  onSelect: (char: string) => void;
  isLoading?: boolean;
}

export function SimilarCharacters({
  characters,
  selectedChar,
  onSelect,
  isLoading = false,
}: SimilarCharactersProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-sans text-sm font-medium uppercase tracking-widest text-ink-light">
        Similar Characters
      </h2>

      {characters.length === 0 && !isLoading ? (
        <p className="py-12 text-center font-sans text-base text-ink-light/60">
          Draw a character to see matches
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
      ) : (
        <div className="grid grid-cols-4 gap-2.5">
          {characters.map((char) => (
            <CharacterButton
              key={char}
              character={char}
              isSelected={selectedChar === char}
              onClick={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
