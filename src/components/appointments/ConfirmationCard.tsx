"use client";

import { getServiceById } from "@/lib/appointments/catalog";
import { DENSITOMETRY_UPSELL_DISCOUNT_PERCENT } from "@/lib/clinical/constants";
import type { Appointment } from "@/lib/appointments/types";
import { productPacks } from "@/lib/products";
import {
  buildAppointmentConfirmationWhatsAppLink,
  buildProductPackWhatsAppLink,
} from "@/lib/whatsapp";

interface ConfirmationCardProps {
  appointment: Appointment;
}

const SLOT_LABELS = { manana: "Mañana", tarde: "Tarde" } as const;

function formatAppointmentDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function ConfirmationCard({ appointment }: ConfirmationCardProps) {
  const service = getServiceById(appointment.serviceId);
  const whatsAppLink = buildAppointmentConfirmationWhatsAppLink(appointment);

  const crossSellPackId =
    appointment.serviceId === "densitometria" ? "hueso-fuerte-360" : "movilidad-total";
  const crossSellPack = productPacks.find((pack) => pack.id === crossSellPackId);
  const crossSellLink = crossSellPack ? buildProductPackWhatsAppLink(crossSellPack) : null;

  return (
    <section className="rounded-2xl border-2 border-risk-low bg-risk-low-bg px-6 py-6 flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-risk-low">✓ Cita confirmada</p>
        <h2 className="text-2xl font-bold text-neutral-900">{service?.name}</h2>
      </div>

      <div className="rounded-xl bg-white/70 px-4 py-3 flex flex-col gap-1 text-neutral-900">
        <p className="text-sm">Código de cita</p>
        <p className="text-3xl font-extrabold tracking-wide">{appointment.code}</p>
        <p className="text-base font-medium">
          {formatAppointmentDate(appointment.date)} · {SLOT_LABELS[appointment.slot]}
        </p>
      </div>

      {service?.prepInstructions && (
        <p className="text-sm font-medium text-neutral-900">
          ⚠️ {service.prepInstructions}
        </p>
      )}

      <a
        href={whatsAppLink}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-12 flex items-center justify-center rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-4 transition-colors"
      >
        Confirmar por WhatsApp
      </a>

      {crossSellLink && crossSellPack && (
        <div className="rounded-xl border-2 border-dashed border-brand/40 px-4 py-3">
          <p className="text-sm font-semibold mb-2 text-neutral-900">
            Agrega tu {crossSellPack.name} con {DENSITOMETRY_UPSELL_DISCOUNT_PERCENT}% OFF al acudir a tu cita.
          </p>
          <a
            href={crossSellLink}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-12 flex items-center justify-center rounded-xl bg-white border-2 border-brand text-brand font-semibold px-4"
          >
            Reservar pack con descuento
          </a>
        </div>
      )}
    </section>
  );
}
