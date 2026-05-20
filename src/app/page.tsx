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
import { useCharacterRecognition } from '@/hooks/useCharacterRecognition';

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
    if (mode === 'speak') {
      // In speak mode, clicking a match opens the detail view
      setSpeakDetailChar(char);
    } else {
      setSelectedChar((prev) => (prev === char ? null : char));
    }
  }, [mode]);

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

  const currentMatches =
    mode === 'draw'
      ? drawMatches
      : mode === 'type'
        ? typeMatches
        : speakMatches;

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

  return (
    <div className="relative z-10 flex min-h-full flex-col">
      <Header />

      <div className="ink-wash-divider mx-6 sm:mx-8" />

      <main className="flex flex-1 flex-col items-center px-6 py-10 sm:px-8">
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

            {phrase.length > 0 && (
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
            />
          </div>
        </div>
      </main>

      <div className="ink-wash-divider mx-6 mb-4 sm:mx-8" />
      <footer className="pb-4 text-center font-sans text-xs text-ink-light/40">
        红日 Redsun
      </footer>
    </div>
  );
}
