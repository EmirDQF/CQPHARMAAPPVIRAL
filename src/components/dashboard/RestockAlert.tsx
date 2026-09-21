import { productPacks } from "@/lib/products";
import { buildProductPackWhatsAppLink } from "@/lib/whatsapp";

const RESTOCK_PACK_ID = "hueso-fuerte-360";
const BOTTLE_LEVEL_PERCENT = 15;

export function RestockAlert() {
  const pack = productPacks.find((p) => p.id === RESTOCK_PACK_ID);
  if (!pack) return null;

  const whatsAppLink = buildProductPackWhatsAppLink(pack);

  return (
    <section className="rounded-2xl border-2 border-risk-moderate/50 bg-risk-moderate-bg px-6 py-6 flex flex-col gap-4">
      <p className="font-semibold text-risk-moderate">
        🔔 Tu frasco de {pack.name} está al {BOTTLE_LEVEL_PERCENT}%
      </p>

      <div className="h-3 w-full rounded-full bg-white/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-risk-moderate"
          style={{ width: `${BOTTLE_LEVEL_PERCENT}%` }}
        />
      </div>

      <p className="text-sm text-neutral-700">
        Pide tu reposición hoy con descuento antes de interrumpir tu tratamiento.
      </p>

      <a
        href={whatsAppLink}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-12 flex items-center justify-center rounded-xl bg-risk-moderate text-white font-semibold px-4 transition-colors hover:opacity-90"
      >
        Reponer Mi Pack con Descuento
      </a>
    </section>
  );
}
