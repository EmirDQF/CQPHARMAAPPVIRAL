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
            className="text-xs font-semibold rounded-full bg-pastel-mint text-pastel-mint-ink px-3 py-1"
          >
            {badge}
          </span>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-bold">{pack.name}</h3>
        <p className="text-lg text-muted">{pack.tagline}</p>
      </div>

      <ul className="text-sm text-muted flex flex-col gap-1">
        {pack.formula.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-clinic" aria-hidden="true">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="text-lg text-muted mt-auto">{pack.indication}</p>

      <WhatsAppCta
        href={whatsAppLink}
        className="w-full text-center rounded-xl btn-primary font-semibold px-4 py-3"
      >
        Reservar por WhatsApp
      </WhatsAppCta>
    </div>
  );
}
