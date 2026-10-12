"use client";

import { useSyncExternalStore } from "react";
import { GameButton } from "@/components/ui/GameButton";
import { usePillboxReminders } from "@/hooks/usePillboxReminders";
import { supportsBackgroundWifiNudges } from "@/lib/native/artikoReminders";
import type { ReminderSupport } from "@/lib/reminders/reminders";
import { setTrigger, silenceToday, smartRemindersStore, unsilence } from "@/lib/reminders/smart/settings";
import { toLimaIsoDate } from "@/lib/utils/date";
import { SettingsCard } from "./SettingsCard";

const PERMISSION_TEXT: Readonly<Record<ReminderSupport, string>> = {
  granted: "✅ Avisos permitidos en este celular.",
  ask: "Aún no diste permiso de avisos a Artikare.",
  "ios-install": "En iPhone, instala Artikare en tu pantalla de inicio para recibir avisos.",
  calendar: "Los avisos están bloqueados en los ajustes del teléfono. Puedes permitirlos ahí cuando quieras.",
};

interface ToggleProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-lg font-bold">{label}</span>
        <span className="text-base text-muted">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-7 w-12 shrink-0 cursor-pointer accent-vital-deep" />
    </label>
  );
}

/** Recordatorios de Artiko por disparador: todo opt-in, revocable y sin salir del celular. */
export function SmartRemindersSection() {
  const settings = useSyncExternalStore(smartRemindersStore.subscribe, smartRemindersStore.getSnapshot, smartRemindersStore.getServerSnapshot);
  const reminders = usePillboxReminders();
  const isSilencedToday = settings.silencedOn === toLimaIsoDate();
  const wifiHint = supportsBackgroundWifiNudges()
    ? "Si quedan misiones, un aviso genérico al conectarte a Wi-Fi, también con la app cerrada (revisa cada 15 min)."
    : "Si quedan misiones, Artiko te lo dice al conectarte a Wi-Fi con la app abierta.";

  return (
    <SettingsCard
      id="ajustes-recordatorios"
      title="Recordatorios de Artiko"
      description="Máximo 3 avisos al día contando las tomas, nunca entre las 22:00 y las 7:00 y nunca si ya completaste tu día. Los avisos no muestran datos de salud."
    >
      <p role="status" className="text-lg">
        {reminders.support === null ? "Revisando el permiso de avisos…" : PERMISSION_TEXT[reminders.support]}
      </p>
      {reminders.support === "ask" && (
        <GameButton tone="sky" size="md" onClick={() => void reminders.requestPermission()}>
          🔔 Permitir avisos
        </GameButton>
      )}
      <Toggle label="Aviso al conectarte a Wi-Fi" hint={wifiHint} checked={settings.wifiNudges} onChange={(on) => setTrigger("wifiNudges", on)} />
      <Toggle
        label="Pausa activa"
        hint="Tras unos 10 minutos seguidos en la app, Artiko te propone 1 minuto de respiración."
        checked={settings.activeBreaks}
        onChange={(on) => setTrigger("activeBreaks", on)}
      />
      <GameButton tone="surface" size="md" haptic={false} onClick={() => (isSilencedToday ? unsilence() : silenceToday())}>
        {isSilencedToday ? "🔔 Volver a activar hoy" : "🔕 Silenciar hoy"}
      </GameButton>
    </SettingsCard>
  );
}
