'use client';

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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
      </svg>
    ),
  },
  {
    id: 'type',
    label: 'Type',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
  },
];

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-full bg-ink-wash p-1">
      {modes.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          className={`
            flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-sans font-medium
            transition-all duration-200
            ${
              mode === id
                ? 'bg-ink text-rice-paper shadow-sm'
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
