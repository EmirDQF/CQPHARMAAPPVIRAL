import { z } from "zod";
import { createPersistentStore } from "../storage/persistentStore";

/**
 * Preferencias de respuesta sensorial (local, sin datos de salud). La
 * vibración viene encendida porque confirma un toque sin mirar; el sonido
 * viene apagado y por ahora la app no reproduce ninguno.
 */
export const FEEDBACK_PREFERENCES_VERSION = 1;

const feedbackPreferencesSchema = z.object({
  version: z.literal(FEEDBACK_PREFERENCES_VERSION),
  haptics: z.boolean().catch(true),
  sound: z.boolean().catch(false),
  /** Confeti y animaciones de celebración (además de prefers-reduced-motion). */
  celebrations: z.boolean().catch(true),
});

export type FeedbackPreferences = z.infer<typeof feedbackPreferencesSchema>;

export const DEFAULT_FEEDBACK_PREFERENCES: FeedbackPreferences = {
  version: FEEDBACK_PREFERENCES_VERSION,
  haptics: true,
  sound: false,
  celebrations: true,
};

/** null = versión desconocida: el store no la sobrescribe. */
export function parseFeedbackPreferences(raw: unknown): FeedbackPreferences | null {
  const parsed = feedbackPreferencesSchema.safeParse(raw);
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
