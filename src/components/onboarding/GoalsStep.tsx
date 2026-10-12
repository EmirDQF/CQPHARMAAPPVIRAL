"use client";

import { useState } from "react";
import { ChoiceGroup, type ChoiceOption } from "@/components/ui/ChoiceGroup";
import { GameButton } from "@/components/ui/GameButton";
import { usePillboxReminders } from "@/hooks/usePillboxReminders";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import { DAILY_GOAL_BY_INTENSITY, type Intensity } from "@/lib/onboarding/onboarding";
import type { ReminderSupport } from "@/lib/reminders/reminders";
import { formatTime24hForDisplay } from "@/lib/utils/date";
import { StepHeading } from "./StepHeading";

const INTENSITY_OPTIONS: readonly ChoiceOption<Intensity>[] = [
  { value: "light", label: `🌱 Ligero · ${DAILY_GOAL_BY_INTENSITY.light} al día` },
  { value: "normal", label: `⭐ Normal · ${DAILY_GOAL_BY_INTENSITY.normal} al día` },
  { value: "pro", label: `🔥 Pro · ${DAILY_GOAL_BY_INTENSITY.pro} al día` },
];

const PERIOD_EMOJI = { morning: "☀️", night: "🌙" } as const;

const SUPPORT_MESSAGE: Readonly<Record<Exclude<ReminderSupport, "ask">, string>> = {
  granted: "✅ Recordatorios activados. El aviso dice solo “Recordatorio de Artikare”, sin datos de salud.",
  "ios-install": "En iPhone, los recordatorios funcionan al instalar Artikare en tu pantalla de inicio.",
  calendar: "Tu celular no permite avisos ahora. Puedes activarlos luego en los ajustes del teléfono.",
};

function ReminderPermission() {
  const reminders = usePillboxReminders();
  const [hasDeclined, setHasDeclined] = useState(false);
  if (reminders.support === null) return null;
  if (reminders.support !== "ask") return <p role="status" className="text-lg">{SUPPORT_MESSAGE[reminders.support]}</p>;
  if (hasDeclined) return <p role="status" className="text-lg">Listo, sin avisos. Puedes activarlos cuando quieras.</p>;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-pastel-sky p-4 text-pastel-sky-ink">
      <p className="text-lg">
        ¿Te aviso a esas horas? El aviso es genérico (“Recordatorio de Artikare”): no muestra datos de salud en tu pantalla.
      </p>
      <GameButton tone="sky" size="lg" block onClick={() => void reminders.requestPermission()}>
        🔔 Activar recordatorios
      </GameButton>
      <GameButton tone="surface" size="md" block haptic={false} onClick={() => setHasDeclined(true)}>
        Ahora no
      </GameButton>
    </div>
  );
}

/** Metas del día y horarios de toma (fijos, hora de Lima). El permiso de avisos se pide solo aquí, al tocar. */
export function GoalsStep({ onDone }: { onDone: (intensity: Intensity) => void }) {
  const [intensity, setIntensity] = useState<Intensity>("normal");

  return (
    <div className="flex flex-col gap-5">
      <StepHeading>Tu meta diaria 🎯</StepHeading>
      <ChoiceGroup
        legend="¿Cuántas misiones al día?"
        hint="Puedes cambiarlo cuando quieras."
        name="first-run-intensity"
        options={INTENSITY_OPTIONS}
        value={intensity}
        onChange={setIntensity}
        stacked
      />
      <section aria-labelledby="first-run-times" className="flex flex-col gap-2">
        <h2 id="first-run-times" className="text-lg font-bold">Horarios de tus tomas (hora de Lima)</h2>
        <ul className="flex gap-3">
          {DOSE_SCHEDULE.map((dose) => (
            <li key={dose.id} className="flex-1 rounded-2xl bg-surface p-4 text-center shadow-soft">
              <span aria-hidden="true" className="block text-3xl">{PERIOD_EMOJI[dose.period]}</span>
              <span className="text-2xl font-black">{formatTime24hForDisplay(dose.time)}</span>
            </li>
          ))}
        </ul>
        <p className="text-base text-muted">Son los horarios indicados del plan. Si tu médico te indicó otros, síguelo a él.</p>
      </section>
      <ReminderPermission />
      <GameButton tone="vital" size="xl" block onClick={() => onDone(intensity)}>
        ¡Listo! 🚀
      </GameButton>
    </div>
  );
}
