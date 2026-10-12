import { BrandMark } from "@/components/brand/BrandMark";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Artikare, ir al inicio" className="min-h-11 flex items-center rounded-control text-lg">
          <BrandMark />
        </Link>

        <Link
          href="/citas"
          className="min-h-11 inline-flex items-center rounded-control btn-primary text-sm font-semibold px-4"
        >
          Agendar Densitometría
        </Link>
      </div>
    </header>
  );
}
