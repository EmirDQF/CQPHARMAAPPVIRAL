import type { ProductPack } from "./products";
import type { RiskResult } from "./types";

const FALLBACK_WHATSAPP_NUMBER = "51999999999";

function getWhatsAppNumber(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? FALLBACK_WHATSAPP_NUMBER;
}

function buildWhatsAppLink(message: string): string {
  const digitsOnly = getWhatsAppNumber().replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export function buildDensitometriaWhatsAppLink(result: RiskResult): string {
  const message = `Hola, hice el Test de Edad Articular de Artikare. Mi edad articular estimada es ${result.articularAge} años (${result.label}). Quisiera agendar mi ${result.diagnosticSuggestion}.`;
  return buildWhatsAppLink(message);
}

export function buildSupplementWhatsAppLink(result: RiskResult): string {
  const message = `Hola, hice el Test de Edad Articular de Artikare. Mi resultado fue ${result.label} (edad articular ${result.articularAge} años). Quisiera información sobre el ${result.supplementProtocol}.`;
  return buildWhatsAppLink(message);
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
