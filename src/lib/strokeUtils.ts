import type { Point } from '@/types';

/**
 * Convert our Point[][] strokes into the format HanziLookupJS expects:
 * Array of strokes, each stroke = array of [x, y] coordinate pairs.
 * Coordinates are normalized to fit within a consistent bounding box.
 */
export function normalizeStrokes(
  strokes: Point[][],
  canvasWidth: number,
  canvasHeight: number
): Array<Array<[number, number]>> {
  // HanziLookupJS normalizes internally, but we want consistent input
  return strokes.map((stroke) =>
    stroke.map(
      (p) =>
        [
          (p.x / canvasWidth) * 256,
          (p.y / canvasHeight) * 256,
        ] as [number, number]
    )
  );
}
