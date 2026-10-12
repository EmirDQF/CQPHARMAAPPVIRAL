import { z } from "zod";
import { createPersistentStore } from "../storage/persistentStore";

/**
 * Tamaño de letra de toda la app (local, sin datos de salud). Escala el `rem`
 * raíz desde globals.css (`html[data-text-size]`), así crecen textos, botones
 * y espacios juntos. Pensado para adultos de 35 a 70 años.
 */
export const TEXT_SIZE_VERSION = 1;
export const TEXT_SIZES = ["normal", "large", "xlarge"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  normal: "Normal",
  large: "Grande",
  xlarge: "Muy grande",
};

const textSizeSchema = z.object({
  version: z.literal(TEXT_SIZE_VERSION),
  size: z.enum(TEXT_SIZES).catch("normal"),
});

export type TextSizePreference = z.infer<typeof textSizeSchema>;

export const DEFAULT_TEXT_SIZE: TextSizePreference = { version: TEXT_SIZE_VERSION, size: "normal" };

/** null = versión desconocida: el store no la sobrescribe. */
export function parseTextSize(raw: unknown): TextSizePreference | null {
  const parsed = textSizeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const textSizeStore = createPersistentStore<TextSizePreference>(
  "artikare_text_size_v1",
  DEFAULT_TEXT_SIZE,
  parseTextSize
);

export function setTextSize(size: TextSize): void {
  textSizeStore.write({ version: TEXT_SIZE_VERSION, size });
}
