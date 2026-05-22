'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { InputMode } from '@/types';

interface ModeSwitcherProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

const modes: { id: InputMode; label: string; icon: React.ReactNode }[] = [
  {
    id: 'draw',
    label: 'Draw',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
      </svg>
    ),
  },
  {
    id: 'type',
    label: 'Type',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M6 8h.01" />
        <path d="M10 8h.01" />
        <path d="M14 8h.01" />
        <path d="M18 8h.01" />
        <path d="M8 12h.01" />
        <path d="M12 12h.01" />
        <path d="M16 12h.01" />
        <path d="M7 16h10" />
      </svg>
    ),
  },
  {
    id: 'speak',
    label: 'Speak',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
  },
];

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  const buttonRefs = useRef<Partial<Record<InputMode, HTMLButtonElement>>>({});
  // Geometry of the dark pill, in pixels relative to the container's padding box.
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const btn = buttonRefs.current[mode];
    if (btn) setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [mode]);

  // Re-measure when the active mode changes, on resize, and once webfonts
  // settle (label widths shift slightly when Inter swaps in).
  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <div
      className="relative flex items-center justify-center gap-1 rounded-full p-1.5"
      style={{
        backgroundColor: '#F8F3EB',
        boxShadow:
          '0 2px 8px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(26, 26, 26, 0.08)',
      }}
    >
      {/* Sliding pill — glides between options instead of teleporting */}
      {pill && (
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 rounded-full bg-ink shadow-sm"
          style={{
            left: pill.left,
            width: pill.width,
            transition:
              'left 320ms cubic-bezier(0.34, 1.3, 0.64, 1), width 320ms cubic-bezier(0.34, 1.3, 0.64, 1)',
          }}
        />
      )}

      {modes.map(({ id, label, icon }) => (
        <button
          key={id}
          ref={(el) => {
            if (el) buttonRefs.current[id] = el;
          }}
          onClick={() => onModeChange(id)}
          className={`
            relative z-10 flex items-center gap-2 rounded-full px-5 py-2.5
            text-base font-sans font-medium transition-colors duration-200
            ${
              mode === id
                ? 'text-rice-paper'
                : 'text-ink-light hover:text-ink'
            }
          `}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}
