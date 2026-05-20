'use client';

import { useState, useCallback, useEffect } from 'react';
import type { InputMode, Point } from '@/types';
import { Header } from '@/components/Header';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { ModeSwitcher } from '@/components/ModeSwitcher';
import { TypeInput } from '@/components/TypeInput';
import { SpeakInput } from '@/components/SpeakInput';
import { SimilarCharacters } from '@/components/SimilarCharacters';
import { useCharacterRecognition } from '@/hooks/useCharacterRecognition';

export default function Home() {
  const [mode, setMode] = useState<InputMode>('draw');
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [typeMatches, setTypeMatches] = useState<string[]>([]);
  const [speakMatches, setSpeakMatches] = useState<string[]>([]);
  const [drawStrokes, setDrawStrokes] = useState<Point[][]>([]);

  const { matches: drawMatches, isLoading, recognize } =
    useCharacterRecognition(600);

  // Trigger recognition when strokes change
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
    setSelectedChar((prev) => (prev === char ? null : char));
  }, []);

  const handleModeChange = useCallback((newMode: InputMode) => {
    setMode(newMode);
    setSelectedChar(null);
  }, []);

  const currentMatches =
    mode === 'draw'
      ? drawMatches
      : mode === 'type'
        ? typeMatches
        : speakMatches;

  return (
    <div className="relative z-10 flex min-h-full flex-col">
      <Header />

      <div className="ink-wash-divider mx-6 sm:mx-8" />

      <main className="flex flex-1 flex-col items-center px-6 py-10 sm:px-8">
        {/* Hero area: canvas + similar characters */}
        <div className="flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
          {/* Input area (canvas / type / speak) */}
          <div className="flex w-full max-w-[600px] flex-col items-center gap-6">
            {mode === 'draw' && (
              <DrawingCanvas onStrokesChange={handleStrokesChange} />
            )}
            {mode === 'type' && <TypeInput onMatches={handleTypeMatches} />}
            {mode === 'speak' && (
              <SpeakInput onMatches={handleSpeakMatches} />
            )}

            <ModeSwitcher mode={mode} onModeChange={handleModeChange} />
          </div>

          {/* Similar characters panel */}
          <div className="w-full max-w-[330px] lg:pt-0">
            <SimilarCharacters
              characters={currentMatches}
              selectedChar={selectedChar}
              onSelect={handleCharSelect}
              isLoading={mode === 'draw' && isLoading}
            />
          </div>
        </div>
      </main>

      {/* Decorative ink wash footer line */}
      <div className="ink-wash-divider mx-6 mb-4 sm:mx-8" />
      <footer className="pb-4 text-center font-sans text-xs text-ink-light/40">
        红日 Redsun
      </footer>
    </div>
  );
}
