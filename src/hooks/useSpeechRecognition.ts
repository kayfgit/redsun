'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  /** Called once with the full transcript when capture fully ends. */
  onResult?: (transcript: string) => void;
}

interface SpeechRecognitionState {
  /** Live (interim) transcript, for display while capturing. */
  transcript: string;
  isSupported: boolean;
  /** Begin capturing — call on press-down for hold-to-talk. */
  start: () => void;
  /** Stop capturing — call on release. Triggers `onResult`. */
  stop: () => void;
  /** Abort and clear everything without firing `onResult`. */
  reset: () => void;
}

// Bound on self-restarts within one hold, so a silent/mic-less session can't
// spin forever. Reset whenever real audio comes through.
const MAX_RESTARTS = 10;
// Chromium throws if start() runs before the engine finishes tearing down,
// so restarts are deferred by this much.
const RESTART_DELAY = 180;

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): SpeechRecognitionState {
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const capturingRef = useRef(false); // user is holding the button
  const runningRef = useRef(false); // a recognition session is live
  const wantsResultRef = useRef(false); // user released — a result is expected
  const finalRef = useRef(''); // finalized text from completed sessions
  const sessionFinalRef = useRef(''); // finalized text from the current session
  const restartsRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest callback without re-creating the recognition object.
  const onResultRef = useRef(options.onResult);
  onResultRef.current = options.onResult;

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    // Single-utterance mode is far more reliable across Chromium browsers
    // than `continuous`; we restart it ourselves while the button is held.
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let sessionFinal = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) sessionFinal += result[0].transcript;
        else interim += result[0].transcript;
      }
      restartsRef.current = 0; // real audio arrived — refill the restart budget
      sessionFinalRef.current = sessionFinal;
      setTranscript(finalRef.current + sessionFinal + interim);
    };

    recognition.onend = () => {
      runningRef.current = false;
      // Commit this session's finalized text to the running total.
      finalRef.current += sessionFinalRef.current;
      sessionFinalRef.current = '';

      if (capturingRef.current && restartsRef.current < MAX_RESTARTS) {
        // Still held — restart after a delay so the engine can settle.
        restartsRef.current++;
        restartTimerRef.current = setTimeout(() => {
          if (!capturingRef.current) return;
          try {
            recognition.start();
            runningRef.current = true;
          } catch {
            /* retried on the next onend, or ended by the user */
          }
        }, RESTART_DELAY);
        return;
      }

      // Fully stopped — deliver the result only if the user actually released
      // the button, never on an abort/teardown.
      if (wantsResultRef.current) {
        wantsResultRef.current = false;
        onResultRef.current?.(finalRef.current.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Permission/device errors are fatal; 'no-speech'/'aborted'/'network'
      // are transient and handled by onend.
      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed' ||
        event.error === 'audio-capture'
      ) {
        capturingRef.current = false;
        runningRef.current = false;
        wantsResultRef.current = false;
        onResultRef.current?.('');
      }
    };

    return () => {
      capturingRef.current = false;
      wantsResultRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || capturingRef.current) return;

    capturingRef.current = true;
    wantsResultRef.current = false;
    restartsRef.current = 0;
    finalRef.current = '';
    sessionFinalRef.current = '';
    setTranscript('');
    try {
      recognition.start();
      runningRef.current = true;
    } catch {
      // Engine still winding down; its onend will restart because
      // capturingRef is now true.
    }
  }, []);

  const stop = useCallback(() => {
    capturingRef.current = false;
    wantsResultRef.current = true;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    const recognition = recognitionRef.current;
    if (recognition && runningRef.current) {
      // A session is live — stop() finalizes it and onend delivers the result.
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    } else {
      // Released between sessions (during a restart gap) — no onend is
      // coming, so deliver whatever we have right now.
      wantsResultRef.current = false;
      onResultRef.current?.(finalRef.current.trim());
    }
  }, []);

  const reset = useCallback(() => {
    capturingRef.current = false;
    runningRef.current = false;
    wantsResultRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    finalRef.current = '';
    sessionFinalRef.current = '';
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    }
    setTranscript('');
  }, []);

  return { transcript, isSupported, start, stop, reset };
}
