import type { Point, BrushConfig } from '@/types';

function distance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function velocity(a: Point, b: Point): number {
  const dt = b.timestamp - a.timestamp || 1;
  return distance(a, b) / dt;
}

export function getStrokeWidth(
  vel: number,
  pressure: number,
  config: BrushConfig
): number {
  const speed = Math.min(vel / 8, 1);
  const speedWidth =
    config.maxWidth -
    speed * (config.maxWidth - config.minWidth) * config.velocityScale;
  const pressureWidth =
    config.minWidth +
    pressure * (config.maxWidth - config.minWidth) * config.thinning;
  return (speedWidth + pressureWidth) / 2;
}

/**
 * Draw a single segment between two points using lineTo.
 * This guarantees continuous strokes with no gaps, even at high speed.
 */
export function drawSegment(
  ctx: CanvasRenderingContext2D,
  prev: Point,
  curr: Point,
  config: BrushConfig
) {
  const vel = velocity(prev, curr);
  const width = getStrokeWidth(vel, curr.pressure, config);

  ctx.beginPath();
  ctx.moveTo(prev.x, prev.y);
  ctx.lineTo(curr.x, curr.y);
  ctx.lineWidth = Math.max(1, width);
  ctx.strokeStyle = `rgba(26, 26, 26, ${config.inkOpacity})`;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/**
 * Draw a complete stroke with Bezier smoothing and end-taper.
 * Used when redrawing finished strokes (undo, clear).
 */
export function drawFullStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  config: BrushConfig
) {
  if (points.length === 0) return;

  // Stroke start blob
  const r = config.maxWidth * 0.3;
  ctx.beginPath();
  ctx.arc(points[0].x, points[0].y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(26, 26, 26, ${config.inkOpacity})`;
  ctx.fill();

  if (points.length < 2) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const taperStart = Math.max(2, points.length - 5);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const vel = velocity(prev, curr);
    let width = getStrokeWidth(vel, curr.pressure, config);

    // Taper at stroke end
    if (i >= taperStart) {
      const t = (i - taperStart) / (points.length - taperStart);
      width *= 1 - t * 0.7;
    }

    // Use midpoint Bezier for smooth redraw
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    // Also draw a direct line to guarantee fill
    ctx.lineTo(curr.x, curr.y);
    ctx.lineWidth = Math.max(0.5, width);
    ctx.strokeStyle = `rgba(26, 26, 26, ${config.inkOpacity})`;
    ctx.stroke();
  }
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);
}

export function redrawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Point[][],
  width: number,
  height: number,
  config: BrushConfig
) {
  clearCanvas(ctx, width, height);
  for (const stroke of strokes) {
    drawFullStroke(ctx, stroke, config);
  }
}
