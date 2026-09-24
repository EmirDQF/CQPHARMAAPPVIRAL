import type { Appointment } from "./appointments/types";
import type { ProductPack } from "./products";

const FALLBACK_WHATSAPP_NUMBER = "51999999999";

function getWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? FALLBACK_WHATSAPP_NUMBER;
}

function buildWhatsAppLink(message: string): string {
  const digitsOnly = getWhatsAppNumber().replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

// Los mensajes prellenados nunca llevan datos de salud: viajan en la URL (?text=).
export function buildDensitometriaWhatsAppLink(): string {
  return buildWhatsAppLink(
    "Hola, hice el Test de Edad Articular de Artikare y quisiera agendar una densitometría ósea."
  );
}

export function buildSupplementWhatsAppLink(): string {
  return buildWhatsAppLink(
    "Hola, hice el Test de Edad Articular de Artikare y quisiera información sobre los packs CQ Pharma."
  );
}

export function buildProductPackWhatsAppLink(pack: ProductPack): string {
  const message = `Hola, quiero reservar el ${pack.name} de CQ Pharma (${pack.tagline}). ¿Me pueden dar disponibilidad y precio?`;
  return buildWhatsAppLink(message);
}

export function buildGeneralInquiryWhatsAppLink(): string {
  const message =
    "Hola, quisiera hablar con un asesor médico de Artikare sobre mis articulaciones y huesos.";
  return buildWhatsAppLink(message);
}

/** Solo el código: el servicio (dato de salud) y la fecha los consulta el consultorio por código. */
export function buildAppointmentConfirmationWhatsAppLink(
  appointment: Pick<Appointment, "code">
): string {
  return buildWhatsAppLink(`Hola, quiero confirmar mi cita Artikare con código ${appointment.code}.`);
}

/** Solo abre la conversación: el informe se adjunta como archivo descargado, nunca en la URL. */
export function buildClinicalReportWhatsAppLink(): string {
  return buildWhatsAppLink(
    "Hola, quiero compartir mi informe de seguimiento Artikare. Te lo envío como archivo adjunto."
  );
}
