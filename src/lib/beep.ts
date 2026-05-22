/**
 * Plays a short sine-wave beep as audio feedback (e.g. when voice capture
 * starts or stops). Self-contained — creates and closes its own AudioContext.
 */
export function playBeep(frequency = 800, durationMs = 130) {
  if (typeof window === 'undefined') return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;

  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;

  const now = ctx.currentTime;
  const end = now + durationMs / 1000;
  // Quick fade in/out so the beep starts and ends without a click.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(end + 0.03);
  osc.onended = () => void ctx.close();
}
