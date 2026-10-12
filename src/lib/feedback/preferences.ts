import { z } from "zod";
import { createPersistentStore } from "../storage/persistentStore";

/**
 * Preferencias de respuesta sensorial (local, sin datos de salud). Vibración
 * y sonidos vienen encendidos: confirman cada logro sin tener que mirar. Los
 * sonidos son tonos sintetizados por la app (src/lib/feedback/sounds.ts).
 * v1 → v2: en v1 no existía el interruptor de sonido, así que se enciende.
 */
export const FEEDBACK_PREFERENCES_VERSION = 2;

const feedbackPreferencesSchema = z.object({
  version: z.literal(FEEDBACK_PREFERENCES_VERSION),
  haptics: z.boolean().catch(true),
  sound: z.boolean().catch(true),
  /** Confeti y animaciones de celebración (además de prefers-reduced-motion). */
  celebrations: z.boolean().catch(true),
});

export type FeedbackPreferences = z.infer<typeof feedbackPreferencesSchema>;

export const DEFAULT_FEEDBACK_PREFERENCES: FeedbackPreferences = {
  version: FEEDBACK_PREFERENCES_VERSION,
  haptics: true,
  sound: true,
  celebrations: true,
};

/** null = versión desconocida: el store no la sobrescribe. */
export function parseFeedbackPreferences(raw: unknown): FeedbackPreferences | null {
  const isVersion1 = typeof raw === "object" && raw !== null && (raw as { version?: unknown }).version === 1;
  const migrated = isVersion1 ? { ...raw, version: FEEDBACK_PREFERENCES_VERSION, sound: true } : raw;
  const parsed = feedbackPreferencesSchema.safeParse(migrated);
  return parsed.success ? parsed.data : null;
}

export const feedbackPreferencesStore = createPersistentStore<FeedbackPreferences>(
  "artikare_feedback_prefs_v1",
  DEFAULT_FEEDBACK_PREFERENCES,
  parseFeedbackPreferences
);

export function updateFeedbackPreferences(changes: Partial<Omit<FeedbackPreferences, "version">>): void {
  feedbackPreferencesStore.write({ ...feedbackPreferencesStore.getSnapshot(), ...changes });
}
