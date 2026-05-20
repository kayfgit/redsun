'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { CHAR_INFO, PINYIN_MAP } from '@/lib/pinyinData';
import { CharacterDetail } from './CharacterDetail';

interface SpeakInputProps {
  onMatches: (matches: string[]) => void;
  onPanelTitle: (title: string) => void;
  detailChar: string | null;
  onDetailCharChange: (char: string | null) => void;
}

export function SpeakInput({
  onMatches,
  onPanelTitle,
  detailChar,
  onDetailCharChange,
}: SpeakInputProps) {
  const { isListening, transcript, isSupported, toggle, reset } =
    useSpeechRecognition();
  const [detectedChar, setDetectedChar] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);

  // When listening stops and we have a transcript, show result
  useEffect(() => {
    if (isListening) {
      onPanelTitle('');
      return;
    }

    if (!transcript || hasResult) return;

    const chars = transcript.match(/[\u4e00-\u9fff]/g);
    if (chars && chars.length > 0) {
      const mainChar = chars[0];
      setDetectedChar(mainChar);
      setHasResult(true);

      // Find similar matches by pinyin
      const info = CHAR_INFO[mainChar];
      if (info) {
        const basePinyin = info.pinyin
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/ü/g, 'v')
          .toLowerCase();

        const similar: string[] = [];
        for (const [syllable, entries] of Object.entries(PINYIN_MAP)) {
          if (syllable === basePinyin) {
            similar.push(...entries.map(([c]) => c));
          }
        }
        const ordered = [mainChar, ...similar.filter((c) => c !== mainChar)];
        onMatches(ordered.slice(0, 12));
        onPanelTitle('Similar Matches');
      }
    }
  }, [isListening, transcript, hasResult, onMatches, onPanelTitle]);

  const handleSpeakAgain = useCallback(() => {
    reset();
    setDetectedChar(null);
    setHasResult(false);
    onDetailCharChange(null);
    onMatches([]);
    onPanelTitle('');
  }, [reset, onMatches, onPanelTitle, onDetailCharChange]);

  const handleCopy = useCallback((char: string) => {
    navigator.clipboard.writeText(char);
  }, []);

  if (!isSupported) {
    return (
      <div className="flex w-full max-w-[600px] flex-col items-center justify-center aspect-square">
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

  // Detail view for a clicked similar match
  if (detailChar) {
    return (
      <CharacterDetail
        character={detailChar}
        onBack={() => onDetailCharChange(null)}
      />
    );
  }

  // Result view — big character with info
  if (hasResult && detectedChar && !isListening) {
    const info = CHAR_INFO[detectedChar];
    const pinyin = info?.pinyin || '?';
    const meaning = info?.meaning || '?';

    return (
      <div className="flex w-full max-w-[600px] flex-col items-center justify-center gap-4 aspect-square">
        <span className="font-sans text-xl text-ink-light">{pinyin}</span>

        <div className="flex items-center gap-5">
          <span className="font-serif-cn text-[140px] leading-none text-ink">
            {detectedChar}
          </span>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-wash text-ink-light transition-colors hover:bg-ink/10 hover:text-ink"
            title="Play pronunciation (coming soon)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>

        <span className="font-sans text-lg text-ink-light italic">{meaning}</span>

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleCopy(detectedChar)}
            className="flex items-center gap-2 rounded-full border border-ink/10 px-5 py-2.5 font-sans text-sm text-ink-light transition-colors hover:border-ink/20 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            Copy
          </button>
          <button
            onClick={handleSpeakAgain}
            className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-sans text-sm font-medium text-rice-paper transition-colors hover:bg-ink-light"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            Speak again
          </button>
        </div>
      </div>
    );
  }

  // Idle / Listening — microphone button
  return (
    <div className="flex w-full max-w-[600px] flex-col items-center justify-center gap-6 aspect-square">
      <button
        onClick={toggle}
        className={`
          flex h-36 w-36 items-center justify-center rounded-full transition-all duration-300
          ${
            isListening
              ? 'bg-seal-red text-rice-paper shadow-xl shadow-seal-red/25 animate-pulse'
              : 'bg-ink-wash text-ink-light hover:bg-ink/10 hover:text-ink'
          }
        `}
      >
        <svg
          width="54"
          height="54"
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

      <p className="font-sans text-base text-ink-light">
        {isListening ? 'Listening... tap to stop' : 'Tap to speak'}
      </p>

      {isListening && transcript && (
        <p className="px-4 text-center font-serif-cn text-2xl text-ink/50">
          {transcript}
        </p>
      )}
    </div>
  );
}
