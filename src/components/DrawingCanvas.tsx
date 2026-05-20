'use client';

import { useRef } from 'react';
import { useInkBrush } from '@/hooks/useInkBrush';
import type { Point } from '@/types';

interface DrawingCanvasProps {
  onStrokesChange: (strokes: Point[][]) => void;
}

export function DrawingCanvas({ onStrokesChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { strokes, clear, undo } = useInkBrush(canvasRef);

  // Sync strokes to parent via ref check
  const lastLengthRef = useRef(0);
  if (strokes.length !== lastLengthRef.current) {
    lastLengthRef.current = strokes.length;
    // Use queueMicrotask to avoid setState during render
    queueMicrotask(() => onStrokesChange(strokes));
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full aspect-square max-w-[400px] cursor-crosshair rounded-sm touch-none"
        style={{
          backgroundColor: '#F8F3EB',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid rgba(26, 26, 26, 0.08)',
        }}
      />

      {/* Canvas controls */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          onClick={undo}
          disabled={strokes.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-rice-paper/90 text-ink-light transition-all hover:bg-rice-paper-dark disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo last stroke"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          onClick={clear}
          disabled={strokes.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-rice-paper/90 text-ink-light transition-all hover:bg-rice-paper-dark disabled:opacity-30 disabled:cursor-not-allowed"
          title="Clear canvas"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M5 6l1 14h12l1-14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
