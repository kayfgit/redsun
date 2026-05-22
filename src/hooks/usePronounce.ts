'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { audioName } from '@/lib/audioName';

/**
 * Picks the best Mandarin voice for the speech-synthesis fallback. Network
 * ("remote") voices are preferred — Chrome/Edge ship Google Mandarin voices
 * that work even when the OS has no Chinese language pack installed.
 */
function pickChineseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const zh = voices.filter((v) => v.lang.toLowerCase().startsWith('zh'));
  return zh.find((v) => !v.localService) ?? zh[0] ?? null;
}

/**
 * Pronounces Mandarin text aloud and exposes a `speaking` flag for playback UI.
 *
 * Primary source is a pre-generated audio file under /audio (see
 * `scripts/generate-audio.mts`), which needs no OS language pack. If a file is
 * missing it falls back to the browser's speech synthesis.
 */
export function usePronounce() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Identifies the most recent request, so stale callbacks can be ignored.
  const tokenRef = useRef(0);

  // Voice lists load asynchronously in some browsers; nudge them to populate.
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) return;
    synth.getVoices();
    const onVoices = () => synth.getVoices();
    synth.addEventListener('voiceschanged', onVoices);
    return () => {
      synth.removeEventListener('voiceschanged', onVoices);
      synth.cancel();
      audioRef.current?.pause();
    };
  }, []);

  const pronounce = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    const token = ++tokenRef.current;

    // Stop whatever was playing before.
    audioRef.current?.pause();
    audioRef.current = null;
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    setSpeaking(true);

    const stale = () => tokenRef.current !== token;
    const finish = () => {
      if (!stale()) setSpeaking(false);
    };

    // Browser speech-synthesis fallback, used when no audio file exists.
    let fellBack = false;
    const fallback = () => {
      if (stale() || fellBack) return;
      fellBack = true;
      const synth = window.speechSynthesis;
      if (!synth) {
        finish();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      const voice = pickChineseVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 0.8;
      utterance.onend = finish;
      utterance.onerror = finish;
      synth.resume();
      synth.speak(utterance);
    };

    // Primary path: play the pre-generated file.
    const audio = new Audio(`/audio/${audioName(text)}.mp3`);
    audioRef.current = audio;
    audio.onended = finish;
    audio.onerror = fallback;
    audio.play().catch(fallback);
  }, []);

  return { speaking, pronounce };
}
