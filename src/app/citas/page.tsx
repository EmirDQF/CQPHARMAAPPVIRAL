import type { Metadata } from "next";
import { BookingWizard } from "@/components/appointments/BookingWizard";

export const metadata: Metadata = {
  title: "Agenda tu Cita",
  description:
    "Reserva tu densitometría ósea, consulta con especialista en reumatología o control preventivo articular en 3 pasos.",
};

export default function AppointmentsPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6 text-base sm:text-lg">
      <div>
        <h1 className="text-[1.75rem] sm:text-3xl font-bold">Agenda tu Cita</h1>
        <p className="text-muted">
          Reserva en menos de 1 minuto.
        </p>
      </div>

      <BookingWizard />
    </main>
  );
}
