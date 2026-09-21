"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getServiceById } from "@/lib/appointments/catalog";
import { appointmentsStore, getNextUpcomingAppointment } from "@/lib/appointments/store";

const SLOT_LABELS = { manana: "Mañana", tarde: "Tarde" } as const;

function formatAppointmentDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
  });
}

export function NextAppointmentCard() {
  const appointments = useSyncExternalStore(
    appointmentsStore.subscribe,
    appointmentsStore.getSnapshot,
    appointmentsStore.getServerSnapshot
  );
  const nextAppointment = getNextUpcomingAppointment(appointments);

  if (!nextAppointment) {
    return (
      <section className="rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 px-6 py-6 flex flex-col gap-3 items-start">
        <p className="font-semibold">Aún no tienes una cita agendada.</p>
        <Link
          href="/citas"
          className="min-h-12 flex items-center justify-center rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold px-5 transition-colors"
        >
          Agendar mi cita
        </Link>
      </section>
    );
  }

  const service = getServiceById(nextAppointment.serviceId);

  return (
    <section className="rounded-2xl border-2 border-brand bg-brand-light/40 dark:bg-brand-dark/20 px-6 py-6 flex flex-col gap-2">
      <p className="text-sm font-semibold text-brand-dark">📅 Próxima cita</p>
      <p className="text-xl font-bold">{service?.name}</p>
      <p className="text-base font-medium">
        {formatAppointmentDate(nextAppointment.date)} ·{" "}
        {SLOT_LABELS[nextAppointment.slot]} · Código {nextAppointment.code}
      </p>
      {service?.prepInstructions && (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          ⚠️ {service.prepInstructions}
        </p>
      )}
    </section>
  );
}
