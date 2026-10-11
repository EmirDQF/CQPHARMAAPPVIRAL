import { BrandMark } from "@/components/brand/BrandMark";
import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-line mt-8">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-4 text-sm text-muted">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandMark className="text-base" />
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-clinic">
              Inicio
            </Link>
            <Link href="/app" className="hover:text-clinic">
              Mi Panel
            </Link>
            <Link href="/privacidad" className="hover:text-clinic">
              Privacidad
            </Link>
          </nav>
        </div>

        <p>
          Este sitio y su Test de Edad Articular tienen fines informativos y
          orientativos, y no reemplazan un diagnóstico, tratamiento ni
          consulta médica profesional. Ante cualquier duda sobre tu salud
          ósea o articular, consulta a tu especialista en reumatología.
        </p>

        <p>© {currentYear} Artikare · Respaldado por CQ Pharma. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
