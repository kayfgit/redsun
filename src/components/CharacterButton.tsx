'use client';

interface CharacterButtonProps {
  character: string;
  isSelected?: boolean;
  onClick?: (character: string) => void;
}

export function CharacterButton({
  character,
  isSelected = false,
  onClick,
}: CharacterButtonProps) {
  return (
    <button
      onClick={() => onClick?.(character)}
      className={`
        flex h-14 w-14 items-center justify-center rounded-sm
        font-serif-cn text-2xl transition-all duration-200
        ${
          isSelected
            ? 'bg-seal-red/10 text-ink ring-1 ring-seal-red/40'
            : 'bg-rice-paper text-ink hover:bg-rice-paper-dark hover:scale-105'
        }
      `}
      style={{
        boxShadow: isSelected
          ? 'none'
          : '0 1px 2px rgba(26, 26, 26, 0.06)',
      }}
    >
      {character}
    </button>
  );
}
