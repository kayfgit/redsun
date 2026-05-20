import { SealStamp } from './SealStamp';

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <h1 className="font-brush text-3xl tracking-wide text-ink sm:text-4xl">
          红日
        </h1>
        <span className="font-sans text-sm font-medium tracking-widest text-ink-light uppercase">
          Redsun
        </span>
      </div>
      <SealStamp size={36} />
    </header>
  );
}
