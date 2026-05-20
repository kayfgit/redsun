'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point, BrushConfig } from '@/types';
import {
  drawSegment,
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

      // Draw initial dot
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const r = config.maxWidth * 0.3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 26, 26, ${config.inkOpacity})`;
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
        if (dx * dx + dy * dy < 2.25) continue;

        currentStrokeRef.current.push(point);
        drawSegment(ctx, prev, point, config);
      }
    },
    [canvasRef, config, getCanvasPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (currentStrokeRef.current.length === 0) return;

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

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
