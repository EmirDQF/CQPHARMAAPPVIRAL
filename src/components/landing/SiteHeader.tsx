import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandMark } from "@/components/brand/BrandMark";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" aria-label="Artikare, ir al inicio" className="min-h-12 flex items-center rounded-control text-lg">
          <BrandMark />
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link
            href="/citas"
            aria-label="Agendar Densitometría"
            className="min-h-12 inline-flex items-center whitespace-nowrap rounded-control btn-primary text-base font-bold px-4"
          >
            <span aria-hidden="true" className="sm:hidden">Agendar</span>
            <span aria-hidden="true" className="hidden sm:inline">Agendar Densitometría</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
