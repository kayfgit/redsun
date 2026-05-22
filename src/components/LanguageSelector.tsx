'use client';

import { useEffect, useRef, useState } from 'react';
import { LOCALES } from '@/lib/i18n';
import { useLanguage } from './LanguageProvider';

/** Globe glyph shared between the trigger button and nothing else. */
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 font-sans text-sm text-ink-light transition-colors hover:border-ink/20 hover:text-ink"
      >
        <GlobeIcon />
        {locale.toUpperCase()}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute end-0 z-50 mt-2 max-h-[70vh] w-44 overflow-auto rounded-sm border border-ink/10 bg-rice-paper py-1 shadow-xl animate-fadein"
          style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
        >
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-start font-sans text-sm transition-colors ${
                  active
                    ? 'bg-ink/5 text-ink'
                    : 'text-ink-light hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <span>{l.label}</span>
                <span className="font-medium tracking-wide text-ink-light/50">
                  {l.code.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
