'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copies text to the clipboard and exposes a transient `copied` flag so the UI
 * can show success feedback. The flag auto-resets after `resetMs`.
 */
export function useCopy(resetMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return;
      }
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { copied, copy };
}
