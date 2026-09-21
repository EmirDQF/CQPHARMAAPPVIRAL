import { productPacks } from "@/lib/products";
import { ProductCard } from "./ProductCard";

export function ProductShopSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-16 flex flex-col gap-8">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Packs Clínicos CQ Pharma
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
          Suplementación de alta absorción, prescrita según tu diagnóstico.
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
