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
  /** Wall-clock time (performance.now) of the previous `move` call. */
  private lastMoveTime = 0;
  /** Time-smoothed brush speed (px/ms), eased toward each new reading. */
  private smoothedSpeed = 0;

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

  /** Call on every brush movement; `distance` is pixels travelled since the last point. */
  move(distance: number) {
    this.init();
    if (!this.ctx || !this.gain || !this.filter || !this.noise) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();

    const now = this.ctx.currentTime;

    // Turn "pixels since the last point" into an actual speed (px per ms)
    // using wall-clock time between calls. Pointer events fire at a roughly
    // fixed rate, so distance alone barely reflects how fast the user draws —
    // dividing by elapsed time does. Gaps are clamped so a pause then a
    // fresh dab doesn't read as a huge speed.
    const t = performance.now();
    const dt = this.lastMoveTime ? Math.min(t - this.lastMoveTime, 100) : 16;
    this.lastMoveTime = t;
    const rawSpeed = distance / Math.max(dt, 1); // px/ms

    // Ease the speed toward each new reading rather than using it raw. The
    // per-event speed is jumpy — distance varies and dt is coarse — and
    // driving the gain straight off it makes the sound lurch between levels
    // (the "popping"). The smoothing factor is time-aware: it eases hard
    // when events are sparse (slow drawing, stays responsive) and gently
    // when they flood in (fast drawing, where the jumpiness is worst), so
    // the result is a continuous very-slow → very-fast sweep.
    const alpha = 1 - Math.exp(-dt / 40);
    this.smoothedSpeed += (rawSpeed - this.smoothedSpeed) * alpha;
    const speed = this.smoothedSpeed;

    // 0 = barely creeping, 1 = fast sweep. The exponent curves the response
    // so loudness grows in even-feeling steps across the whole speed range
    // instead of jumping from soft straight to loud.
    const intensity = Math.min(1, speed / 3) ** 0.7;

    // Louder the faster the brush travels.
    const level = 0.01 + intensity * 0.075;
    const gain = this.gain.gain;
    // Glide to the movement level with a soft time constant — no sharp
    // attack means no clicks — then queue a decay back to silence. While the
    // brush keeps moving each call resets this, so the sound only sustains
    // during actual travel; a held-still press falls quiet.
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.setTargetAtTime(level, now, 0.05);
    gain.setTargetAtTime(0, now + 0.12, 0.08);

    // Sweep the bandpass from a dark, low rustle when slow to a bright hiss
    // when fast.
    this.filter.frequency.setTargetAtTime(600 + intensity * 2600, now, 0.06);

    // Shift the noise texture's pitch as well: a slow drag has a deeper,
    // coarser grain, a fast stroke a thinner, higher one. This timbre change
    // is what makes slow vs fast clearly distinct, not just louder/quieter.
    this.noise.playbackRate.setTargetAtTime(0.6 + intensity * 1.1, now, 0.08);
  }

  /** Call when the brush lifts — fades the sound out quickly. */
  lift() {
    this.lastMoveTime = 0;
    this.smoothedSpeed = 0;
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
