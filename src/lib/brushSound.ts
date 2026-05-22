/**
 * Synthesised brush-on-paper sound. It runs a loop of filtered white noise
 * whose loudness and brightness track how fast the brush is moving, so the
 * faster you paint the more pronounced the "shhh" — no audio asset required.
 */
export class BrushSound {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private disposed = false;

  /** Builds the audio graph lazily — must run inside a user gesture. */
  private init() {
    if (this.ctx || this.disposed) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    // 2 seconds of white noise, looped — the raw friction texture.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Bandpass shapes the flat hiss into a soft paper-like rustle.
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1600;
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    this.ctx = ctx;
    this.noise = noise;
    this.filter = filter;
    this.gain = gain;
  }

  /** Call on every brush movement; `speed` is pixels travelled since the last point. */
  move(speed: number) {
    this.init();
    if (!this.ctx || !this.gain || !this.filter) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const now = this.ctx.currentTime;
    const intensity = Math.min(1, speed / 22);
    const level = 0.012 + intensity * 0.07;

    // Rise to the movement level, then immediately queue a decay back to
    // silence. While the brush keeps moving each call resets this, so the
    // sound only sustains during actual travel — a held-still press goes quiet.
    const gain = this.gain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.setTargetAtTime(level, now, 0.015);
    gain.setTargetAtTime(0, now + 0.07, 0.05);

    this.filter.frequency.setTargetAtTime(1100 + intensity * 1800, now, 0.04);
  }

  /** Call when the brush lifts — fades the sound out quickly. */
  lift() {
    if (!this.ctx || !this.gain) return;
    this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }

  dispose() {
    this.disposed = true;
    try {
      this.noise?.stop();
    } catch {
      /* already stopped */
    }
    void this.ctx?.close();
    this.ctx = null;
  }
}
