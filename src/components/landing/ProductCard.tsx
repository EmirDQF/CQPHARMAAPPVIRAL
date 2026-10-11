import type { ProductPack } from "@/lib/products";
import { buildProductPackWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppCta } from "@/components/ui/WhatsAppCta";

interface ProductCardProps {
  pack: ProductPack;
}

export function ProductCard({ pack }: ProductCardProps) {
  const whatsAppLink = buildProductPackWhatsAppLink(pack);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface shadow-soft p-6 h-full">
      <div className="flex flex-wrap gap-2">
        {pack.badges.map((badge) => (
          <span
            key={badge}
            className="text-xs font-semibold rounded-full bg-brand-light text-brand-dark px-3 py-1"
          >
            {badge}
          </span>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-bold">{pack.name}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{pack.tagline}</p>
      </div>

      <ul className="text-sm text-neutral-600 dark:text-neutral-300 flex flex-col gap-1">
        {pack.formula.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-brand" aria-hidden="true">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted mt-auto">{pack.indication}</p>

      <WhatsAppCta
        href={whatsAppLink}
        className="w-full text-center rounded-xl bg-action-strong hover:bg-brand-dark active:scale-[0.98] text-white font-semibold px-4 py-3 transition-colors"
      >
        Reservar por WhatsApp
      </WhatsAppCta>
    </div>
  );
}
