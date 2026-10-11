import { ArticularTest } from "@/components/ArticularTest/ArticularTest";
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
        <div className="flex flex-col items-center px-4 pt-12 pb-16 gap-10 bg-gradient-to-b from-pastel-sky to-canvas">
          <div className="max-w-2xl text-center flex flex-col gap-4">
            <p className="text-pastel-sky-ink font-semibold uppercase tracking-wide text-sm">
              Artikare · Respaldado por CQ Pharma
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-balance text-pastel-sky-ink">
              Descubre la salud real de tus articulaciones y huesos antes de
              que el dolor limite tu vida.
            </h1>
            <p className="text-ink text-balance">
              Test orientativo interactivo en 2 minutos, densitometría ósea
              precisa y nutrición celular clínica.
            </p>
          </div>

          <ArticularTest />
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
