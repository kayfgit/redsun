'use client';

import { useLanguage } from './LanguageProvider';
import { LanguageSelector } from './LanguageSelector';

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        {/* Brand — never translated */}
        <h1 className="font-brush text-4xl tracking-wide text-ink sm:text-5xl">
          红日
        </h1>
        <span className="font-sans text-sm font-medium tracking-widest text-ink-light uppercase">
          Redsun
        </span>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSelector />

        {/* Login placeholder — feature still in development, so disabled */}
        <button
          disabled
          title="Login is in development"
          aria-disabled="true"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-full bg-ink/30 px-4 py-1.5 font-sans text-sm font-medium text-rice-paper/70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {t('nav.login')}
        </button>
      </div>
    </header>
  );
}
