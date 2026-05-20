'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point, BrushConfig } from '@/types';
import {
  drawStrokeStart,
  drawSmoothSegment,
  drawFullStroke,
  clearCanvas,
  redrawAllStrokes,
} from '@/lib/inkBrushEngine';
import { DEFAULT_BRUSH_CONFIG } from '@/lib/constants';

export function useInkBrush(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: BrushConfig = DEFAULT_BRUSH_CONFIG
) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const lastPointTimeRef = useRef(0);

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

      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawStrokeStart(ctx, point, config);
      }
    },
    [canvasRef, config, getCanvasPoint]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!currentStrokeRef.current.length) return;

      const now = Date.now();
      if (now - lastPointTimeRef.current < 5) return; // throttle
      lastPointTimeRef.current = now;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(e);
      const prev = currentStrokeRef.current[currentStrokeRef.current.length - 1];
      currentStrokeRef.current.push(point);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawSmoothSegment(ctx, prev, point, config);
      }
    },
    [canvasRef, config, getCanvasPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (currentStrokeRef.current.length === 0) return;

    const completedStroke = [...currentStrokeRef.current];
    currentStrokeRef.current = [];
    setIsDrawing(false);

    // Redraw the completed stroke with proper tapering
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setStrokes((prev) => {
          const newStrokes = [...prev, completedStroke];
          // Redraw everything with proper taper on the last stroke
          redrawAllStrokes(ctx, newStrokes, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1), config);
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

  // Set up canvas DPI and attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // HiDPI setup
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    // Pointer events
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [canvasRef, handlePointerDown, handlePointerMove, handlePointerUp]);

  return { strokes, isDrawing, clear, undo };
}
