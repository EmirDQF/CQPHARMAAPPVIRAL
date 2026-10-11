import type { Appointment } from "./appointments/types";
import { readWhatsAppNumber } from "./env";
import type { ProductPack } from "./products";

/** Aviso accesible para los botones de WhatsApp cuando no hay número configurado. */
export const WHATSAPP_UNAVAILABLE_MESSAGE = "WhatsApp no disponible por el momento";

/**
 * Todos los builders devuelven null si NEXT_PUBLIC_WHATSAPP_NUMBER falta o es
 * inválido (en cualquier entorno): la UI debe deshabilitar el botón, nunca
 * usar un número inventado.
 */
function buildWhatsAppLink(message: string): string | null {
  const phoneNumber = readWhatsAppNumber();
  if (!phoneNumber) return null;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export function isWhatsAppAvailable(): boolean {
  return readWhatsAppNumber() !== null;
}

// Los mensajes prellenados nunca llevan datos de salud: viajan en la URL (?text=).
export function buildDensitometriaWhatsAppLink(): string | null {
  return buildWhatsAppLink(
    "Hola, hice el Test de Edad Articular de Artikare y quisiera agendar una densitometría ósea."
  );
}

export function buildSupplementWhatsAppLink(): string | null {
  return buildWhatsAppLink(
    "Hola, hice el Test de Edad Articular de Artikare y quisiera información sobre los packs CQ Pharma."
  );
}

/** Reposición: el descuento ofrecido en la app viaja en el mensaje, para que el consultorio lo aplique. */
export function buildRestockWhatsAppLink(pack: ProductPack, discountPercent: number): string | null {
  return buildWhatsAppLink(
    `Hola, quiero reponer el ${pack.name} de CQ Pharma con el ${discountPercent} % de descuento de reposición. ¿Me confirman disponibilidad y precio?`
  );
}

export function buildProductPackWhatsAppLink(pack: ProductPack): string | null {
  const message = `Hola, quiero reservar el ${pack.name} de CQ Pharma (${pack.tagline}). ¿Me pueden dar disponibilidad y precio?`;
  return buildWhatsAppLink(message);
}

export function buildGeneralInquiryWhatsAppLink(): string | null {
  const message =
    "Hola, quisiera hablar con un asesor médico de Artikare sobre mis articulaciones y huesos.";
  return buildWhatsAppLink(message);
}

/** Solo el código: el servicio (dato de salud) y la fecha los consulta el consultorio por código. */
export function buildAppointmentConfirmationWhatsAppLink(
  appointment: Pick<Appointment, "code">
): string | null {
  return buildWhatsAppLink(`Hola, quiero confirmar mi cita Artikare con código ${appointment.code}.`);
}

/** Solo abre la conversación: el informe se adjunta como archivo descargado, nunca en la URL. */
export function buildClinicalReportWhatsAppLink(): string | null {
  return buildWhatsAppLink(
    "Hola, quiero compartir mi informe de seguimiento Artikare. Te lo envío como archivo adjunto."
  );
}
