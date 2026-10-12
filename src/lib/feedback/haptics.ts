import { Capacitor } from "@capacitor/core";
import { feedbackPreferencesStore, type FeedbackPreferences } from "./preferences";

/**
 * Vibración corta al tocar un botón: @capacitor/haptics en la app nativa (se
 * carga solo ahí) y navigator.vibrate en la web. Siempre opcional: si la
 * persona la apagó en Ajustes o el equipo no vibra, no pasa nada.
 */
export type HapticStrength = "light" | "medium" | "success";

/** Duración del pulso web por intensidad (ms). */
export const HAPTIC_VIBRATION_MS: Readonly<Record<HapticStrength, number>> = {
  light: 12,
  medium: 24,
  success: 40,
};

export interface HapticDependencies {
  isNativeApp: () => boolean;
  readPreferences: () => FeedbackPreferences;
  nativeImpact: (strength: HapticStrength) => Promise<void>;
  vibrate?: (durationMs: number) => boolean;
}

async function nativeImpact(strength: HapticStrength): Promise<void> {
  const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
  if (strength === "success") {
    await Haptics.notification({ type: NotificationType.Success });
    return;
  }
  await Haptics.impact({ style: strength === "medium" ? ImpactStyle.Medium : ImpactStyle.Light });
}

function browserVibrate(): HapticDependencies["vibrate"] {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return undefined;
  return (durationMs) => navigator.vibrate(durationMs);
}

function defaultDependencies(): HapticDependencies {
  return {
    isNativeApp: () => Capacitor.isNativePlatform(),
    readPreferences: feedbackPreferencesStore.getSnapshot,
    nativeImpact,
    vibrate: browserVibrate(),
  };
}

export async function triggerHaptic(
  strength: HapticStrength = "light",
  deps: HapticDependencies = defaultDependencies()
): Promise<void> {
  if (!deps.readPreferences().haptics) return;
  try {
    if (deps.isNativeApp()) {
      await deps.nativeImpact(strength);
      return;
    }
    deps.vibrate?.(HAPTIC_VIBRATION_MS[strength]);
  } catch {
    // Sin vibración disponible (permiso, equipo o plugin): el toque ya funcionó igual.
  }
}
