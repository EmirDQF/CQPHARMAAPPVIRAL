import { productPacks } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductShopSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col gap-8">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-clinic">
          Packs Clínicos CQ Pharma
        </h2>
        <p className="text-muted max-w-2xl mx-auto">
          Diagnóstico en consultorio y suplementos que complementan el plan de tu médico.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {productPacks.map((pack) => (
          <ProductCard key={pack.id} pack={pack} />
        ))}
      </div>
    </section>
  );
}
