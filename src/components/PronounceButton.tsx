'use client';

import { usePronounce } from '@/hooks/usePronounce';
import { useLanguage } from './LanguageProvider';

interface PronounceButtonProps {
  /** The character or phrase to speak aloud. */
  text: string;
  /** Pixel size of the icon / bars. */
  iconSize?: number;
  /** Sizing classes for the button itself, e.g. "h-10 w-10". */
  className?: string;
}

/** Static speaker glyph shown when idle. */
function SpeakerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

/** Animated equalizer bars shown while audio is playing. */
function SoundBars({ size }: { size: number }) {
  return (
    <span
      className="flex items-center justify-center gap-[2px]"
      style={{ height: size, width: size }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-full bg-current"
          style={{
            height: '70%',
            transformOrigin: 'center',
            animation: `sound-bar 680ms ease-in-out ${i * 130}ms infinite`,
          }}
        />
      ))}
    </span>
  );
}

/**
 * Speaker button that pronounces `text` on click and shows animated bars
 * while the audio plays.
 */
export function PronounceButton({
  text,
  iconSize = 18,
  className = '',
}: PronounceButtonProps) {
  const { speaking, pronounce } = usePronounce();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => pronounce(text)}
      title={speaking ? t('pronounce.playing') : t('pronounce.play')}
      aria-label={t('pronounce.play')}
      className={`flex items-center justify-center rounded-full transition-colors ${
        speaking
          ? 'bg-seal-red/10 text-seal-red'
          : 'bg-ink-wash text-ink-light hover:bg-ink/10 hover:text-ink'
      } ${className}`}
    >
      {speaking ? <SoundBars size={iconSize} /> : <SpeakerIcon size={iconSize} />}
    </button>
  );
}
