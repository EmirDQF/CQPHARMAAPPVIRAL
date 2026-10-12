import Link from "next/link";
import { ArticularTest } from "@/components/ArticularTest/ArticularTest";
import { ArtikoFigure } from "@/components/mascot/ArtikoFigure";
import { gameButtonClasses } from "@/components/ui/gameButtonClasses";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { PainEvidenceSection } from "@/components/landing/PainEvidenceSection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { ProductShopSection } from "@/components/landing/ProductShopSection";
import { BlogHubSection } from "@/components/landing/BlogHubSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 flex flex-col">
        <div className="flex flex-col items-center px-4 pt-10 pb-16 gap-10 bg-gradient-to-b from-pastel-sky to-canvas">
          <div className="max-w-2xl text-center flex flex-col items-center gap-5">
            <p className="text-pastel-sky-ink font-bold uppercase tracking-wide text-base">
              Artikare · Respaldado por CQ Pharma
            </p>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-balance text-pastel-sky-ink">
              Descubre la salud real de tus articulaciones y huesos antes de
              que el dolor limite tu vida.
            </h1>
            <div className="flex items-center gap-3 text-left">
              <ArtikoFigure emotion="welcome" size={112} decorative className="shrink-0" />
              <p className="rounded-2xl border-2 border-line bg-surface px-4 py-3 text-lg font-bold text-ink shadow-soft">
                ¡Hola! Soy Artiko 👋 Haz el test orientativo de 2 minutos y luego te acompaño cada día en la app.
              </p>
            </div>
            <p className="text-ink text-lg text-balance">
              Test orientativo interactivo en 2 minutos, densitometría ósea
              precisa y nutrición celular clínica.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="#test-articular" className={gameButtonClasses({ tone: "vital", size: "lg" })}>
                Evaluar mi salud ósea gratis 🎯
              </Link>
              <Link href="/citas" className={gameButtonClasses({ tone: "surface", size: "lg" })}>
                Agendar densitometría
              </Link>
            </div>
          </div>

          <div id="test-articular" className="w-full scroll-mt-20">
            <ArticularTest />
          </div>
        </div>

        <PainEvidenceSection />
        <EcosystemSection />
        <ProductShopSection />
        <BlogHubSection />
        <SocialProofSection />
      </main>

      <SiteFooter />
    </>
  );
}
