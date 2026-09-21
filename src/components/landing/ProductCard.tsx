import type { ProductPack } from "@/lib/products";
import { buildProductPackWhatsAppLink } from "@/lib/whatsapp";

interface ProductCardProps {
  pack: ProductPack;
}

export function ProductCard({ pack }: ProductCardProps) {
  const whatsAppLink = buildProductPackWhatsAppLink(pack);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 h-full">
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

      <p className="text-xs text-neutral-500 mt-auto">{pack.indication}</p>

      <a
        href={whatsAppLink}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full text-center rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-3 transition-colors"
      >
        Reservar por WhatsApp
      </a>
    </div>
  );
}
