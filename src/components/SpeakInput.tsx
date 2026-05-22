'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useCopy } from '@/hooks/useCopy';
import { playBeep } from '@/lib/beep';
import { PronounceButton } from './PronounceButton';
import { CHAR_INFO, PINYIN_MAP, PHRASE_DICT } from '@/lib/pinyinData';
import { CharacterDetail } from './CharacterDetail';
import { useLanguage } from './LanguageProvider';
import { Meaning } from './Meaning';

interface SpeakInputProps {
  onMatches: (matches: string[]) => void;
  onPanelTitle: (title: string) => void;
  detailChar: string | null;
  onDetailCharChange: (char: string | null) => void;
}

type Phase = 'idle' | 'capturing' | 'processing' | 'result' | 'empty';

// If recognition somehow never delivers a result, don't hang forever.
const PROCESSING_TIMEOUT = 6000;

export function SpeakInput({
  onMatches,
  onPanelTitle,
  detailChar,
  onDetailCharChange,
}: SpeakInputProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<Phase>('idle');
  // The full detected text — a single character or a multi-character phrase.
  const [detected, setDetected] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  // Interprets a finished transcript: keep every Han character. A single
  // character surfaces same-pinyin neighbours; a phrase surfaces its own
  // characters.
  const handleResult = useCallback(
    (text: string) => {
      const chars = text.match(/[一-鿿]/g);
      if (!chars || chars.length === 0) {
        setPhase('empty');
        return;
      }

      const detectedText = chars.join('');
      setDetected(detectedText);

      if (chars.length === 1) {
        const info = CHAR_INFO[detectedText];
        if (info) {
          const basePinyin = info.pinyin
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/ü/g, 'v')
            .toLowerCase();

          const similar: string[] = [];
          for (const [syllable, entries] of Object.entries(PINYIN_MAP)) {
            if (syllable === basePinyin) {
              similar.push(...entries.map(([c]) => c));
            }
          }
          const ordered = [
            detectedText,
            ...similar.filter((c) => c !== detectedText),
          ];
          onMatches(ordered.slice(0, 12));
          onPanelTitle(t('panel.similarMatches'));
        } else {
          onMatches([detectedText]);
          onPanelTitle(t('panel.detected'));
        }
      } else {
        // Phrase — list its individual characters.
        onMatches(chars);
        onPanelTitle(t('panel.characters'));
      }

      setPhase('result');
    },
    [onMatches, onPanelTitle, t]
  );

  const { transcript, isSupported, start, stop, reset } = useSpeechRecognition({
    onResult: handleResult,
  });

  // Safety net: never get stuck on the processing screen.
  useEffect(() => {
    if (phase !== 'processing') return;
    const timer = setTimeout(() => setPhase('empty'), PROCESSING_TIMEOUT);
    return () => clearTimeout(timer);
  }, [phase]);

  // Hold-to-talk. A ref tracks the press so the release handler isn't fooled
  // by a stale render value.
  const holdingRef = useRef(false);

  const handlePressStart = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (holdingRef.current) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      holdingRef.current = true;
      onMatches([]);
      onPanelTitle('');
      setDetected(null);
      setPhase('capturing');
      playBeep(880, 120); // rising tone — capture started
      start();
    },
    [start, onMatches, onPanelTitle]
  );

  const handlePressEnd = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    playBeep(520, 150); // lower tone — capture stopped
    setPhase('processing');
    stop();
  }, [stop]);

  const handleSpeakAgain = useCallback(() => {
    reset();
    setDetected(null);
    setPhase('idle');
    onDetailCharChange(null);
    onMatches([]);
    onPanelTitle('');
  }, [reset, onMatches, onPanelTitle, onDetailCharChange]);

  if (!isSupported) {
    return (
      <div className="flex w-full max-w-[600px] flex-col items-center justify-center gap-2 aspect-square">
        <p className="px-4 text-center font-sans text-sm text-ink-light">
          {t('speak.unsupported')}
          <br />
          <span className="text-xs text-ink-light/50">
            {t('speak.unsupportedHint')}
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

  // Processing — recognition is finishing up
  if (phase === 'processing') {
    return (
      <div className="flex w-full max-w-[600px] flex-col items-center justify-center gap-6 aspect-square">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-ink/15 border-t-seal-red" />
        <p className="font-sans text-base text-ink-light">{t('speak.recognizing')}</p>
      </div>
    );
  }

  // Result — detected character or phrase
  if (phase === 'result' && detected) {
    const chars = Array.from(detected);
    const isPhrase = chars.length > 1;

    const pinyin = isPhrase
      ? chars.map((c) => CHAR_INFO[c]?.pinyin || c).join(' ')
      : CHAR_INFO[detected]?.pinyin || '?';
    const meaning = isPhrase
      ? PHRASE_DICT[detected] ||
        chars.map((c) => CHAR_INFO[c]?.meaning || '?').join(' · ')
      : CHAR_INFO[detected]?.meaning || '?';

    return (
      <div className="flex w-full max-w-[600px] flex-col items-center justify-center gap-4 aspect-square">
        <span className="font-sans text-xl text-ink-light">{pinyin}</span>

        <div className="flex items-center gap-5">
          <span
            className={`font-serif-cn leading-none text-ink ${
              isPhrase ? 'text-[76px]' : 'text-[140px]'
            }`}
          >
            {detected}
          </span>
          <PronounceButton text={detected} iconSize={24} className="h-12 w-12" />
        </div>

        <Meaning
          text={meaning}
          className="font-sans text-lg text-ink-light italic"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => copy(detected)}
            className={`flex items-center gap-2 rounded-full border px-5 py-2.5 font-sans text-sm transition-colors ${
              copied
                ? 'border-seal-red/30 text-seal-red'
                : 'border-ink/10 text-ink-light hover:border-ink/20 hover:text-ink'
            }`}
          >
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
            {copied ? t('action.copied') : t('action.copy')}
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
            {t('speak.speakAgain')}
          </button>
        </div>
      </div>
    );
  }

  // Idle / capturing / empty — the microphone button (no card background)
  const isCapturing = phase === 'capturing';
  return (
    <div className="flex w-full max-w-[600px] flex-col items-center justify-center gap-6 aspect-square">
      <button
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressEnd}
        className={`
          flex h-36 w-36 select-none touch-none items-center justify-center rounded-full transition-all duration-300
          ${
            isCapturing
              ? 'bg-seal-red text-rice-paper shadow-xl shadow-seal-red/25 animate-pulse'
              : 'bg-rice-paper text-ink-light hover:bg-rice-paper-dark hover:text-ink'
          }
        `}
        style={
          isCapturing
            ? undefined
            : { boxShadow: '0 2px 12px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(26,26,26,0.1)' }
        }
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
        {isCapturing
          ? t('speak.listening')
          : phase === 'empty'
            ? t('speak.empty')
            : t('speak.hold')}
      </p>

      {isCapturing && transcript && (
        <p className="px-4 text-center font-serif-cn text-2xl text-ink/50">
          {transcript}
        </p>
      )}
    </div>
  );
}
