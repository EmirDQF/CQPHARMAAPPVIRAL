"use client";

import { useEffect, useEffectEvent, useState, useSyncExternalStore } from "react";
import type { GameState } from "@/hooks/useGame";
import { buildNativeNudgeState, readNativeSentNudges, syncNativeNudgeState } from "@/lib/native/artikoReminders";
import { watchWifiJoins } from "@/lib/native/wifiWatch";
import { deliverNudge } from "@/lib/reminders/smart/deliver";
import type { NudgeMessage } from "@/lib/reminders/smart/messages";
import { DOSE_REMINDERS_PER_DAY, decideNudge } from "@/lib/reminders/smart/policy";
import { recordNudgeSent, sentNudgeSchema, smartRemindersStore, type SentNudge } from "@/lib/reminders/smart/settings";

/** Avisos que mostró el trabajo nativo mientras la app estaba cerrada: cuentan para los topes. */
async function mergeNativeSent(): Promise<void> {
  const known = smartRemindersStore.getSnapshot().sent;
  const nativeSent = await readNativeSentNudges();
  nativeSent
    .flatMap((entry): SentNudge[] => {
      const parsed = sentNudgeSchema.safeParse({ ...entry, messageId: "native" });
      return parsed.success ? [parsed.data] : [];
    })
    .filter((entry) => !known.some((item) => item.date === entry.date && item.slot === entry.slot))
    .forEach(recordNudgeSent);
}

export interface SmartReminders {
  /** Aviso de Artiko dentro de la app (al conectarse a Wi-Fi con la pantalla encendida). */
  inAppNudge: NudgeMessage | null;
  dismissInAppNudge: () => void;
}

/**
 * Recordatorios por contexto mientras "Hoy" está abierto: entrega el estado
 * del día al trabajo nativo de Android y escucha el paso a Wi-Fi. Con la
 * pantalla encendida, Artiko lo dice en la app (sin notificación); si la app
 * quedó en segundo plano, se muestra un aviso genérico (si las reglas lo permiten).
 */
export function useSmartReminders(game: GameState): SmartReminders {
  const settings = useSyncExternalStore(smartRemindersStore.subscribe, smartRemindersStore.getSnapshot, smartRemindersStore.getServerSnapshot);
  const [inAppNudge, setInAppNudge] = useState<NudgeMessage | null>(null);
  const pendingMissions = game.missions.filter((mission) => !game.completed.has(mission.id)).length;
  const nudgeInput = {
    settings,
    today: game.today,
    pendingMissions: game.goal.met ? 0 : pendingMissions,
    lastOpenedOn: game.progress.lastOpenedOn,
    streakDays: game.stats.streak.days,
    doseRemindersPerDay: DOSE_REMINDERS_PER_DAY,
  };
  const nativeStateKey = JSON.stringify(buildNativeNudgeState(nudgeInput));

  useEffect(() => {
    void mergeNativeSent();
  }, []);

  useEffect(() => {
    void syncNativeNudgeState(JSON.parse(nativeStateKey));
  }, [nativeStateKey]);

  const onWifiJoin = useEffectEvent(() => {
    const decision = decideNudge("wifi", { ...nudgeInput, now: new Date() });
    if (!decision.send) return;
    if (document.visibilityState === "visible") {
      setInAppNudge(decision.message);
      return;
    }
    void deliverNudge(decision.message).then((shown) => {
      if (shown) recordNudgeSent({ date: game.today, slot: decision.slot, messageId: decision.message.id });
    });
  });

  useEffect(() => {
    if (!settings.wifiNudges) return;
    let stop: (() => void) | null = null;
    let isActive = true;
    watchWifiJoins(() => onWifiJoin())
      .then((unsubscribe) => (isActive ? (stop = unsubscribe) : unsubscribe()))
      .catch((error: unknown) => console.error("[reminders] No se pudo escuchar la red", error));
    return () => {
      isActive = false;
      stop?.();
    };
  }, [settings.wifiNudges]);

  return { inAppNudge, dismissInAppNudge: () => setInAppNudge(null) };
}
