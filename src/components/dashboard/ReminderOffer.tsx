"use client";

import { AlarmClock } from "lucide-react";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { buildRemindersIcs, type ReminderSupport } from "@/lib/reminders/reminders";
import { formatTime24hForDisplay } from "@/lib/utils/date";

interface ReminderOfferProps {
  support: ReminderSupport;
  onEnable: () => void;
  onSnooze: () => void;
}

const ICS_FILE_NAME = "artikare-recordatorios.ics";

const DOSE_TIMES_LABEL = DOSE_SCHEDULE.map((dose) => formatTime24hForDisplay(dose.time)).join(
  " y "
);

function downloadRemindersIcs(): void {
  const blob = new Blob([buildRemindersIcs()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = ICS_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
}

const SECONDARY_BUTTON_CLASS =
  "min-h-12 rounded-xl border-2 border-brand text-clinic font-semibold px-4 transition-colors hover:bg-pastel-mint";

function CalendarButton() {
  return (
    <button type="button" onClick={downloadRemindersIcs} className={SECONDARY_BUTTON_CLASS}>
      Agregar a mi calendario
    </button>
  );
}

function OfferMessage({ support }: { support: Exclude<ReminderSupport, "granted"> }) {
  if (support === "ios-install") {
    return (
      <p className="text-lg text-muted">
        En iPhone, los avisos funcionan con Artikare instalada: toca Compartir y luego
        «Agregar a inicio». Mientras tanto, puedes usar tu calendario.
      </p>
    );
  }
  if (support === "calendar") {
    return (
      <p className="text-lg text-muted">
        Este navegador no permite avisos. Agrega las tomas a tu calendario y te avisará cada día.
      </p>
    );
  }
  return (
    <p className="text-lg text-muted">
      Un aviso discreto a las {DOSE_TIMES_LABEL} (hora de Lima), sin mostrar tus datos de salud.
    </p>
  );
}

/**
 * Oferta de recordatorios tras la primera toma. Es solo presentación: el
 * permiso, el "Ahora no" y la programación viven en `usePillboxReminders`.
 */
export function ReminderOffer({ support, onEnable, onSnooze }: ReminderOfferProps) {
  if (support === "granted") return null;

  return (
    <section
      aria-labelledby="reminder-offer-title"
      className="rounded-2xl border border-brand/30 bg-pastel-mint p-4 flex flex-col gap-3"
    >
      <h2 id="reminder-offer-title" className="flex items-center gap-2 text-base font-bold">
        <AlarmClock aria-hidden="true" className="size-5 shrink-0" />
        ¿Te recordamos tus tomas?
      </h2>
      <OfferMessage support={support} />
      <div className="flex flex-wrap gap-2">
        {support === "ask" ? (
          <button
            type="button"
            onClick={onEnable}
            className="min-h-12 rounded-xl btn-primary font-bold px-4"
          >
            Activar recordatorios
          </button>
        ) : (
          <CalendarButton />
        )}
        <button
          type="button"
          onClick={onSnooze}
          aria-label="Ahora no, recordármelo más adelante"
          className="min-h-12 rounded-xl text-muted font-semibold px-4"
        >
          Ahora no
        </button>
      </div>
    </section>
  );
}
