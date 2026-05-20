'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  toggle: () => void;
  reset: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wantListeningRef = useRef(false);

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
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setTranscript(full);
    };

    // onend fires when the browser stops the session for any reason.
    // If the user still wants to be listening, restart after a short delay.
    recognition.onend = () => {
      if (wantListeningRef.current) {
        setTimeout(() => {
          if (!wantListeningRef.current) return;
          try {
            recognition.start();
          } catch {
            wantListeningRef.current = false;
            setIsListening(false);
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      // Let onend handle the restart/cleanup — don't change state here
    };
  }, []);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (wantListeningRef.current) {
      // User wants to stop
      wantListeningRef.current = false;
      recognition.stop();
      // isListening will be set false in onend
    } else {
      // User wants to start
      wantListeningRef.current = true;
      setTranscript('');
      setIsListening(true);
      try {
        recognition.start();
      } catch {
        // Already running — that's fine, just update visual state
      }
    }
  }, []);

  const reset = useCallback(() => {
    wantListeningRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try { recognition.stop(); } catch { /* ignore */ }
    }
    setTranscript('');
    setIsListening(false);
  }, []);

  return { isListening, transcript, isSupported, toggle, reset };
}
