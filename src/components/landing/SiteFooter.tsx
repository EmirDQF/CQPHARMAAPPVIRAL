import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 mt-8">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-4 text-sm text-neutral-500">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-bold text-base text-foreground">🦴 Artikare</span>
          <nav className="flex gap-4">
            <Link href="/" className="hover:text-brand">
              Inicio
            </Link>
            <Link href="/app" className="hover:text-brand">
              Mi Panel
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
