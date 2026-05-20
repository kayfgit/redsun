'use client';

import { useEffect } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { COMMON_CHARACTERS } from '@/lib/constants';

interface SpeakInputProps {
  onMatches: (matches: string[]) => void;
}

export function SpeakInput({ onMatches }: SpeakInputProps) {
  const { isListening, transcript, isSupported, startListening, stopListening } =
    useSpeechRecognition();

  useEffect(() => {
    if (!transcript) {
      onMatches([]);
      return;
    }

    // Extract individual Chinese characters from transcript
    const chars = transcript.match(/[\u4e00-\u9fff]/g) || [];
    if (chars.length > 0) {
      // Show the recognized characters plus related ones
      const related: string[] = [...new Set(chars)];
      for (const char of chars) {
        for (const group of COMMON_CHARACTERS) {
          if (group.includes(char)) {
            related.push(...group.filter((c) => !related.includes(c)));
          }
        }
      }
      onMatches(related.slice(0, 12));
    }
  }, [transcript, onMatches]);

  if (!isSupported) {
    return (
      <div className="flex w-full max-w-[400px] flex-col items-center justify-center aspect-square">
        <p className="px-4 text-center font-sans text-sm text-ink-light">
          Speech recognition is not supported in this browser.
          <br />
          <span className="text-xs text-ink-light/50">
            Try Chrome or Edge for speech input.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center justify-center gap-6 aspect-square">
      {/* Microphone button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`
          flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300
          ${
            isListening
              ? 'bg-seal-red text-rice-paper shadow-lg shadow-seal-red/20 animate-pulse'
              : 'bg-ink-wash text-ink-light hover:bg-ink/10 hover:text-ink'
          }
        `}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>

      <p className="font-sans text-sm text-ink-light">
        {isListening ? 'Listening...' : 'Tap to speak'}
      </p>

      {/* Transcript display */}
      {transcript && (
        <p className="px-4 text-center font-serif-cn text-2xl text-ink">
          {transcript}
        </p>
      )}
    </div>
  );
}
