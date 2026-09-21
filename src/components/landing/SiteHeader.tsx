import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-background/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span aria-hidden="true">🦴</span>
          <span>Artikare</span>
        </Link>

        <Link
          href="/citas"
          className="rounded-xl bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2 transition-colors"
        >
          Agendar Densitometría
        </Link>
      </div>
    </header>
  );
}
