'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point, BrushConfig } from '@/types';
import {
  drawSegment,
  clearCanvas,
  redrawAllStrokes,
  makeBristles,
  inkLoadFromDistance,
} from '@/lib/inkBrushEngine';
import { DEFAULT_BRUSH_CONFIG } from '@/lib/constants';
import { BrushSound } from '@/lib/brushSound';

type Bristle = ReturnType<typeof makeBristles>[number];

export function useInkBrush(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: BrushConfig = DEFAULT_BRUSH_CONFIG
) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const bristlesRef = useRef<Bristle[]>([]);
  const cumDistRef = useRef(0);
  const segmentIndexRef = useRef(0);

  // Synthesised brushing sound; lazily builds its audio graph on first stroke.
  const brushSoundRef = useRef<BrushSound | null>(null);
  if (!brushSoundRef.current) brushSoundRef.current = new BrushSound();

  // Mirror of `strokes` for use inside the resize handler, which must redraw
  // without re-running its effect every time the stroke list changes.
  const strokesRef = useRef<Point[][]>([]);
  strokesRef.current = strokes;

  // Match the canvas backing store to its current CSS size × devicePixelRatio.
  // Resizing the backing store clears the canvas, so we redraw afterwards.
  const syncCanvasResolution = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);
    if (targetW === 0 || targetH === 0) return;
    if (canvas.width === targetW && canvas.height === targetH) return;

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    redrawAllStrokes(ctx, strokesRef.current, rect.width, rect.height, config);
  }, [canvasRef, config]);

  const getCanvasPoint = useCallback(
    (e: PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0.5, timestamp: Date.now() };

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const scaleX = (canvas.width / dpr) / rect.width;
      const scaleY = (canvas.height / dpr) / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: e.pressure > 0 ? e.pressure : 0.5,
        timestamp: Date.now(),
      };
    },
    [canvasRef]
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture(e.pointerId);

      const point = getCanvasPoint(e);
      currentStrokeRef.current = [point];
      setIsDrawing(true);

      // Soft onset for the brushing sound (the AudioContext resumes here,
      // inside the pointerdown user gesture, as browsers require).
      brushSoundRef.current?.move(3);

      // Fresh bristles + ink for this stroke (unique geometry each time)
      const seed = point.x * 1000 + point.y + performance.now();
      bristlesRef.current = makeBristles(seed);
      cumDistRef.current = 0;
      segmentIndexRef.current = 0;

      // Draw initial dot — slightly irregular
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const r = config.maxWidth * 0.22;
        ctx.beginPath();
        ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 26, 26, ${config.inkOpacity * 0.9})`;
        ctx.fill();
      }
    },
    [canvasRef, config, getCanvasPoint]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!currentStrokeRef.current.length) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Process all coalesced events for smooth, gap-free strokes
      const events = e.getCoalescedEvents?.() ?? [e];

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      for (const coalescedEvent of events) {
        const point = getCanvasPoint(coalescedEvent);
        const prev = currentStrokeRef.current[currentStrokeRef.current.length - 1];

        // Skip points that are too close (< 1.5px)
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 2.25) continue;

        currentStrokeRef.current.push(point);

        // Modulate the brushing sound by how far the brush just moved.
        const dist = Math.sqrt(d2);
        brushSoundRef.current?.move(dist);

        // Track ink depletion: brush dries as it travels (fixed supply model)
        cumDistRef.current += dist;
        const inkLoad = inkLoadFromDistance(cumDistRef.current);

        segmentIndexRef.current++;
        drawSegment(
          ctx,
          prev,
          point,
          config,
          bristlesRef.current,
          inkLoad,
          segmentIndexRef.current
        );
      }
    },
    [canvasRef, config, getCanvasPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (currentStrokeRef.current.length === 0) return;

    // Brush lifted — fade the brushing sound out.
    brushSoundRef.current?.lift();

    const completedStroke = [...currentStrokeRef.current];
    currentStrokeRef.current = [];
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setStrokes((prev) => {
          const newStrokes = [...prev, completedStroke];
          const dpr = window.devicePixelRatio || 1;
          redrawAllStrokes(ctx, newStrokes, canvas.width / dpr, canvas.height / dpr, config);
          return newStrokes;
        });
      }
    }
  }, [canvasRef, config]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      clearCanvas(ctx, canvas.width / dpr, canvas.height / dpr);
    }
    currentStrokeRef.current = [];
    setStrokes([]);
  }, [canvasRef]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      setStrokes((prev) => {
        const newStrokes = prev.slice(0, -1);
        const dpr = window.devicePixelRatio || 1;
        redrawAllStrokes(ctx, newStrokes, canvas.width / dpr, canvas.height / dpr, config);
        return newStrokes;
      });
    }
  }, [canvasRef, config]);

  // Tear down the audio graph when the component unmounts. A fresh instance
  // is left behind so a remount (e.g. React StrictMode in dev) still has sound.
  useEffect(() => {
    return () => {
      brushSoundRef.current?.dispose();
      brushSoundRef.current = new BrushSound();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    syncCanvasResolution();

    // Keep the backing store sharp when the canvas's CSS size changes...
    const resizeObserver = new ResizeObserver(() => syncCanvasResolution());
    resizeObserver.observe(canvas);

    // ...and when devicePixelRatio changes (browser zoom, monitor move),
    // which a ResizeObserver does not catch since the CSS size is unchanged.
    window.addEventListener('resize', syncCanvasResolution);

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncCanvasResolution);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [canvasRef, syncCanvasResolution, handlePointerDown, handlePointerMove, handlePointerUp]);

  return { strokes, isDrawing, clear, undo };
}
