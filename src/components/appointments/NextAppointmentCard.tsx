"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CalendarCheck2, CalendarPlus, History, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServiceById } from "@/lib/appointments/catalog";
import { appointmentsStore, getPastAppointments, getUpcomingAppointments } from "@/lib/appointments/store";
import type { Appointment } from "@/lib/appointments/types";

const SLOT_LABELS = { manana: "Mañana", tarde: "Tarde" } as const;

function formatAppointmentDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

interface AppointmentItemProps {
  appointment: Appointment;
  isNext?: boolean;
}

function AppointmentItem({ appointment, isNext = false }: AppointmentItemProps) {
  const service = getServiceById(appointment.serviceId);
  return (
    <li
      className={`rounded-control border px-4 py-4 flex flex-col gap-1.5 ${
        isNext ? "border-brand bg-pastel-mint text-pastel-mint-ink" : "border-line bg-surface text-ink"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-semibold first-letter:uppercase">
          {formatAppointmentDate(appointment.date)} · {SLOT_LABELS[appointment.slot]}
        </p>
        {isNext && (
          <Badge variant="surface" className="font-semibold">
            Próxima cita
          </Badge>
        )}
      </div>
      <p className="text-lg font-bold leading-snug">{service?.name}</p>
      <p className="text-lg">
        Código <span className="font-mono font-semibold tracking-wide">{appointment.code}</span>
      </p>
      {isNext && service?.prepInstructions && (
        <p className="mt-1 flex items-start gap-2 rounded-control bg-surface/70 px-3 py-2 text-lg">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{service.prepInstructions}</span>
        </p>
      )}
    </li>
  );
}

function EmptyAppointments() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-control border-2 border-dashed border-line px-4 py-5">
      <p className="font-semibold">Aún no tienes una cita agendada.</p>
      <Link
        href="/citas"
        className="min-h-12 flex items-center justify-center gap-2 rounded-control btn-primary px-5 font-bold"
      >
        <CalendarPlus aria-hidden="true" className="size-5" />
        Agendar mi cita
      </Link>
    </div>
  );
}

/** Próximas citas e historial (reservas guardadas en este celular). */
export function NextAppointmentCard() {
  const appointments = useSyncExternalStore(
    appointmentsStore.subscribe,
    appointmentsStore.getSnapshot,
    appointmentsStore.getServerSnapshot
  );
  const upcoming = getUpcomingAppointments(appointments);
  const past = getPastAppointments(appointments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Mis citas</h2>
        </CardTitle>
        <CardDescription>Densitometrías, consultas y controles reservados desde la app.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="proximas">
          <TabsList className="w-full">
            <TabsTrigger value="proximas">
              <CalendarCheck2 aria-hidden="true" />
              Próximas ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="historial">
              <History aria-hidden="true" />
              Historial ({past.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="proximas" className="pt-2 animate-fade-in">
            {upcoming.length === 0 ? (
              <EmptyAppointments />
            ) : (
              <ul className="flex flex-col gap-3">
                {upcoming.map((appointment, index) => (
                  <AppointmentItem key={appointment.code} appointment={appointment} isNext={index === 0} />
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="historial" className="pt-2 animate-fade-in">
            {past.length === 0 ? (
              <p className="rounded-control bg-canvas px-4 py-4 text-lg text-muted">
                Aquí verás tus citas anteriores para llevar el control de tus chequeos.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {past.map((appointment) => (
                  <AppointmentItem key={appointment.code} appointment={appointment} />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
