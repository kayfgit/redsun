export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <h1 className="font-brush text-4xl tracking-wide text-ink sm:text-5xl">
          红日
        </h1>
        <span className="font-sans text-sm font-medium tracking-widest text-ink-light uppercase">
          Redsun
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Language selector placeholder */}
        <button className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 font-sans text-sm text-ink-light transition-colors hover:border-ink/20 hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          EN
        </button>

        {/* Login placeholder */}
        <button className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 font-sans text-sm font-medium text-rice-paper transition-colors hover:bg-ink-light">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Log in
        </button>
      </div>
    </header>
  );
}
