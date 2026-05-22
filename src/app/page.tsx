'use client';

import { useState, useCallback, useEffect } from 'react';
import type { InputMode, Point } from '@/types';
import { Header } from '@/components/Header';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { TypeInput } from '@/components/TypeInput';
import { SpeakInput } from '@/components/SpeakInput';
import { SimilarCharacters } from '@/components/SimilarCharacters';
import { PhraseBuilder } from '@/components/PhraseBuilder';
import { CharacterModal } from '@/components/CharacterModal';
import { useCharacterRecognition } from '@/hooks/useCharacterRecognition';
import { CHAR_INFO } from '@/lib/pinyinData';

interface PhraseEntry {
  char: string;
  pinyin: string;
  meaning: string;
}

export default function Home() {
  const [mode, setMode] = useState<InputMode>('draw');
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [typeMatches, setTypeMatches] = useState<string[]>([]);
  const [speakMatches, setSpeakMatches] = useState<string[]>([]);
  const [drawStrokes, setDrawStrokes] = useState<Point[][]>([]);
  const [phrase, setPhrase] = useState<PhraseEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [speakPanelTitle, setSpeakPanelTitle] = useState('');
  const [speakDetailChar, setSpeakDetailChar] = useState<string | null>(null);
  const [modalChar, setModalChar] = useState<string | null>(null);

  const { matches: drawMatches, isLoading, recognize } =
    useCharacterRecognition(600);

  useEffect(() => {
    if (mode === 'draw') {
      recognize(drawStrokes);
    }
  }, [drawStrokes, mode, recognize]);

  const handleStrokesChange = useCallback((strokes: Point[][]) => {
    setDrawStrokes(strokes);
  }, []);

  const handleTypeMatches = useCallback((chars: string[]) => {
    setTypeMatches(chars);
  }, []);

  const handleSpeakMatches = useCallback((chars: string[]) => {
    setSpeakMatches(chars);
  }, []);

  const handleCharSelect = useCallback((char: string) => {
    setSelectedChar(char);
    setModalChar(char);
  }, []);

  const handleModeChange = useCallback((newMode: InputMode) => {
    setMode(newMode);
    setSelectedChar(null);
    setSelectedIndex(0);
    setSpeakPanelTitle('');
    setSpeakDetailChar(null);
  }, []);

  const handleConfirm = useCallback((entries: PhraseEntry[]) => {
    setPhrase((prev) => [...prev, ...entries]);
  }, []);

  const handleClearPhrase = useCallback(() => {
    setPhrase([]);
  }, []);

  // Only surface characters we actually have pinyin/meaning data for.
  // (For phrases — strings longer than 1 — we let them through; the modal
  // breaks them down per-character with graceful fallbacks.)
  const filterKnown = (chars: string[]) =>
    chars.filter((c) => c.length > 1 || CHAR_INFO[c]);

  const currentMatches = filterKnown(
    mode === 'draw'
      ? drawMatches
      : mode === 'type'
        ? typeMatches
        : speakMatches
  );

  const highlightIdx =
    mode === 'type' && currentMatches.length > 0
      ? selectedIndex
      : mode === 'draw' && currentMatches.length > 0
        ? 0
        : -1;

  const panelTitle =
    mode === 'speak' && speakPanelTitle
      ? speakPanelTitle
      : undefined;

  // Empty-state hint, phrased for whichever input mode is active.
  const emptyHint =
    mode === 'type'
      ? 'Type pinyin to see matches'
      : mode === 'speak'
        ? 'Hold to speak and see matches'
        : 'Draw a character to see matches';

  return (
    <div className="relative z-10 flex h-full flex-col overflow-hidden">
      <Header />

      <div className="ink-wash-divider mx-6 sm:mx-8" />

      <main className="flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-6 sm:px-8">
        <div className="flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
          {/* Input area */}
          <div className="flex w-full max-w-[600px] flex-col items-center gap-6">
            {mode === 'draw' && (
              <DrawingCanvas onStrokesChange={handleStrokesChange} />
            )}
            {mode === 'type' && (
              <TypeInput
                onMatches={handleTypeMatches}
                onConfirm={handleConfirm}
                selectedIndex={selectedIndex}
                onSelectedIndexChange={setSelectedIndex}
              />
            )}
            {mode === 'speak' && (
              <SpeakInput
                onMatches={handleSpeakMatches}
                onPanelTitle={setSpeakPanelTitle}
                detailChar={speakDetailChar}
                onDetailCharChange={setSpeakDetailChar}
              />
            )}

            {mode === 'type' && phrase.length > 0 && (
              <PhraseBuilder entries={phrase} onClear={handleClearPhrase} />
            )}

            <ModeSwitcher mode={mode} onModeChange={handleModeChange} />
          </div>

          {/* Panel */}
          <div className="w-full max-w-[330px] lg:pt-0">
            <SimilarCharacters
              characters={currentMatches}
              selectedChar={mode === 'speak' ? speakDetailChar : selectedChar}
              highlightIndex={highlightIdx}
              onSelect={handleCharSelect}
              isLoading={mode === 'draw' && isLoading}
              title={panelTitle}
              emptyHint={emptyHint}
            />
          </div>
        </div>
      </main>

      <div className="ink-wash-divider mx-6 mb-4 sm:mx-8" />
      <footer className="pb-5 pt-1 text-center font-sans text-xs text-ink-light/40">
        红日 Redsun
      </footer>

      {modalChar && (
        <CharacterModal
          character={modalChar}
          onClose={() => setModalChar(null)}
        />
      )}
    </div>
  );
}
