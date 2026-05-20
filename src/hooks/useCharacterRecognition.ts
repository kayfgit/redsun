'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point } from '@/types';
import { normalizeStrokes } from '@/lib/strokeUtils';
import { COMMON_CHARACTERS } from '@/lib/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    HanziLookup: any;
  }
}

interface CharacterMatch {
  character: string;
  score: number;
}

export function useCharacterRecognition(canvasSize: number = 400) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState<string[]>([]);
  const initDoneRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load HanziLookupJS script and initialize data
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const script = document.createElement('script');
    script.src = '/hanzilookup.min.js';
    script.async = true;
    script.onload = () => {
      if (window.HanziLookup) {
        window.HanziLookup.init('mmah', '/mmah.json', (success: boolean) => {
          if (success) {
            setIsReady(true);
          }
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  const recognize = useCallback(
    (strokes: Point[][]) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (strokes.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }

      if (!isReady || !window.HanziLookup) {
        // Fallback: show placeholder chars based on stroke count
        const idx = Math.min(strokes.length - 1, COMMON_CHARACTERS.length - 1);
        setMatches(COMMON_CHARACTERS[idx]);
        return;
      }

      setIsLoading(true);

      debounceRef.current = setTimeout(() => {
        try {
          const normalized = normalizeStrokes(strokes, canvasSize, canvasSize);
          const analyzed = new window.HanziLookup.AnalyzedCharacter(normalized);
          const matcher = new window.HanziLookup.Matcher('mmah');

          matcher.match(
            analyzed,
            15,
            (results: CharacterMatch[]) => {
              const chars = results.map((r) => r.character);
              setMatches(chars);
              setIsLoading(false);
            }
          );
        } catch {
          setIsLoading(false);
        }
      }, 300);
    },
    [isReady, canvasSize]
  );

  return { matches, isLoading, isReady, recognize };
}
