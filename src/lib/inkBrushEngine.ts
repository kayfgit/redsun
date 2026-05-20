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
  // Normalize velocity (px/ms) to 0-1
  const speed = Math.min(vel / 8, 1);

  // Faster → thinner (brush lifting off paper)
  const speedWidth =
    config.maxWidth -
    speed * (config.maxWidth - config.minWidth) * config.velocityScale;

  // Pressure from stylus or simulated
  const pressureWidth =
    config.minWidth +
    pressure * (config.maxWidth - config.minWidth) * config.thinning;

  return (speedWidth + pressureWidth) / 2;
}

export function drawStrokeStart(
  ctx: CanvasRenderingContext2D,
  point: Point,
  config: BrushConfig
) {
  // Small dot at touch-down (brush landing)
  const radius = config.maxWidth * 0.35;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(26, 26, 26, ${config.inkOpacity})`;
  ctx.fill();
}

export function drawSmoothSegment(
  ctx: CanvasRenderingContext2D,
  prev: Point,
  curr: Point,
  config: BrushConfig
) {
  const vel = velocity(prev, curr);
  const width = getStrokeWidth(vel, curr.pressure, config);

  const midX = (prev.x + curr.x) / 2;
  const midY = (prev.y + curr.y) / 2;

  ctx.beginPath();
  ctx.moveTo(prev.x, prev.y);
  ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);

  ctx.lineWidth = width;
  // Slight opacity variation for organic ink feel
  const alpha = config.inkOpacity - 0.03 + Math.random() * 0.06;
  ctx.strokeStyle = `rgba(26, 26, 26, ${Math.min(1, Math.max(0.7, alpha))})`;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function drawFullStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  config: BrushConfig
) {
  if (points.length === 0) return;

  // Stroke start blob
  drawStrokeStart(ctx, points[0], config);

  if (points.length < 2) return;

  // Main body
  const taperStart = Math.max(2, points.length - 4);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const vel = velocity(prev, curr);

    let width = getStrokeWidth(vel, curr.pressure, config);

    // Taper the ending
    if (i >= taperStart) {
      const taperProgress = (i - taperStart) / (points.length - taperStart);
      width *= 1 - taperProgress * 0.7;
    }

    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    ctx.lineWidth = Math.max(0.5, width);
    ctx.strokeStyle = `rgba(26, 26, 26, ${config.inkOpacity})`;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
