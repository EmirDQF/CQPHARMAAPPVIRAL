import { useId, type ReactNode } from "react";
import { WHATSAPP_UNAVAILABLE_MESSAGE } from "@/lib/whatsapp";

interface WhatsAppCtaProps {
  /** Enlace de un builder de `@/lib/whatsapp`; null = WhatsApp no configurado. */
  href: string | null;
  className: string;
  /** Clases extra del contenedor en estado deshabilitado (p. ej. `flex-1` dentro de una fila). */
  containerClassName?: string;
  children: ReactNode;
}

const DISABLED_CLASSES = "opacity-50 cursor-not-allowed";

/**
 * Botón de WhatsApp. Sin número configurado se muestra deshabilitado con un
 * aviso visible y asociado por aria-describedby: nunca un número de reserva.
 * Sin estado de cliente: sirve en Server y Client Components.
 */
export function WhatsAppCta({
  href,
  className,
  containerClassName = "",
  children,
}: WhatsAppCtaProps) {
  const noticeId = useId();

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`.trim()}>
      <button
        type="button"
        disabled
        aria-describedby={noticeId}
        className={`${className} ${DISABLED_CLASSES}`}
      >
        <span>{children}</span>
      </button>
      <p id={noticeId} className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
        {WHATSAPP_UNAVAILABLE_MESSAGE}
      </p>
    </div>
  );
}
