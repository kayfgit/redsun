import type { Point, BrushConfig } from '@/types';

// ── Helpers ──

function dist(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function vel(a: Point, b: Point): number {
  return dist(a, b) / (b.timestamp - a.timestamp || 1);
}

// Cheap deterministic noise seeded by position — avoids importing a library
function noise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.1234) * 43758.5453;
  return n - Math.floor(n);
}

// ── Bristle model ──

interface Bristle {
  offset: number;    // perpendicular offset from center (-1 to 1)
  inkBias: number;   // how quickly this bristle dries (0.7–1.3)
  widthScale: number; // individual thickness variation
}

/**
 * Generate a fixed set of bristles for a stroke.
 * Each stroke gets unique bristle geometry so no two strokes are identical.
 */
export function makeBristles(seed: number, count: number = 7): Bristle[] {
  const bristles: Bristle[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * 2 - 1; // -1 to 1
    bristles.push({
      offset: t + (noise(i, seed, 0) - 0.5) * 0.35,
      inkBias: 0.75 + noise(i, seed, 1) * 0.5,
      widthScale: 0.5 + noise(i, seed, 2) * 0.7,
    });
  }
  return bristles;
}

// ── Width from velocity & pressure ──

export function getStrokeWidth(v: number, pressure: number, cfg: BrushConfig): number {
  const speed = Math.min(v / 8, 1);
  const fromSpeed = cfg.maxWidth - speed * (cfg.maxWidth - cfg.minWidth) * cfg.velocityScale;
  const fromPressure = cfg.minWidth + pressure * (cfg.maxWidth - cfg.minWidth) * cfg.thinning;
  return (fromSpeed + fromPressure) / 2;
}

// ── Real-time segment (called per pointermove) ──

/**
 * Draw a segment. The body of the stroke is rendered as a solid dark line
 * (with subtle edge irregularity); bristles only become visible as the ink
 * runs out near the end of the stroke (feibai 飞白).
 *
 * `inkLoad` is 0–1. Around 1 → solid wet stroke. Below ~0.35 → dry/split.
 */
export function drawSegment(
  ctx: CanvasRenderingContext2D,
  prev: Point,
  curr: Point,
  cfg: BrushConfig,
  bristles: Bristle[],
  inkLoad: number,
  segmentIndex: number,
) {
  const v = vel(prev, curr);
  const width = getStrokeWidth(v, curr.pressure, cfg);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Dry threshold — below this, the brush starts to split into visible bristles
  const DRY_THRESHOLD = 0.35;

  if (inkLoad >= DRY_THRESHOLD) {
    // ── Wet phase: solid dark stroke with very subtle edge wobble ──
    // Slight width jitter so edges aren't perfectly smooth
    const wobble = (noise(segmentIndex, prev.x, prev.y) - 0.5) * 0.15;
    const w = Math.max(0.8, width * (1 + wobble));

    const alpha = Math.min(1, cfg.inkOpacity * (0.92 + inkLoad * 0.08));

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.lineWidth = w;
    ctx.strokeStyle = `rgba(26, 26, 26, ${alpha})`;
    ctx.stroke();
    return;
  }

  // ── Dry phase (feibai 飞白): the brush splits into individual bristle hairs ──
  // Direction normal for offsets
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  // Smooth fade between solid and bristled: t = 0 at threshold, 1 at fully dry
  const dryT = 1 - inkLoad / DRY_THRESHOLD; // 0..1

  // Faded solid core underneath (still gives some continuity)
  const coreAlpha = cfg.inkOpacity * Math.max(0, inkLoad / DRY_THRESHOLD) * 0.6;
  if (coreAlpha > 0.02) {
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.lineWidth = width * (1 - dryT * 0.4);
    ctx.strokeStyle = `rgba(26, 26, 26, ${coreAlpha})`;
    ctx.stroke();
  }

  // Individual bristle hairs
  for (const bristle of bristles) {
    const bristleInk = inkLoad * bristle.inkBias;

    // As the brush dries, more bristles skip — creates the broken streak look
    const skipRand = noise(curr.x, curr.y, bristle.offset * 100 + segmentIndex);
    if (skipRand > bristleInk * 2.5) continue;

    const offsetPx = bristle.offset * width * 0.45;
    const x1 = prev.x + nx * offsetPx;
    const y1 = prev.y + ny * offsetPx;
    const x2 = curr.x + nx * offsetPx;
    const y2 = curr.y + ny * offsetPx;

    const bWidth = Math.max(0.4, width * 0.12 * bristle.widthScale);
    const alpha = Math.min(1, cfg.inkOpacity * Math.max(0.15, bristleInk));

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = bWidth;
    ctx.strokeStyle = `rgba(26, 26, 26, ${alpha})`;
    ctx.stroke();
  }
}

// ── Full stroke redraw (undo / initial render) ──

/** Ink load is always full — the brush never runs dry. */
export function inkLoadFromDistance(): number {
  return 1;
}

export function drawFullStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  cfg: BrushConfig,
  strokeSeed?: number,
) {
  if (points.length === 0) return;

  const seed = strokeSeed ?? (points[0].x * 1000 + points[0].y);
  const bristles = makeBristles(seed);

  // Start dot — slightly irregular, full ink
  const r = cfg.maxWidth * 0.22;
  ctx.beginPath();
  ctx.arc(points[0].x, points[0].y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(26, 26, 26, ${cfg.inkOpacity})`;
  ctx.fill();

  if (points.length < 2) return;

  const taperStart = Math.max(2, points.length - 5);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const inkLoad = inkLoadFromDistance();

    // Taper at stroke end
    let taperScale = 1;
    if (i >= taperStart) {
      const t = (i - taperStart) / (points.length - taperStart);
      taperScale = 1 - t * 0.6;
    }

    const localCfg = {
      ...cfg,
      maxWidth: cfg.maxWidth * taperScale,
      minWidth: cfg.minWidth * taperScale,
    };

    drawSegment(ctx, prev, curr, localCfg, bristles, inkLoad, i);
  }
}

// ── Canvas utilities ──

export function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
}

export function redrawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Point[][],
  w: number,
  h: number,
  cfg: BrushConfig,
) {
  clearCanvas(ctx, w, h);
  for (let s = 0; s < strokes.length; s++) {
    const seed = strokes[s][0]
      ? strokes[s][0].x * 1000 + strokes[s][0].y + s * 7777
      : s;
    drawFullStroke(ctx, strokes[s], cfg, seed);
  }
}
