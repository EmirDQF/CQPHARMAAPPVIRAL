import { z } from "zod";
import { createPersistentStore } from "../../storage/persistentStore";
import { toLimaIsoDate } from "../../utils/date";
import { NUDGE_SLOTS } from "./messages";

/**
 * Ajustes de los recordatorios por contexto (`artikare_smart_reminders_v1`),
 * solo en el celular. Los disparadores de contexto vienen APAGADOS (opt-in) y
 * se apagan cuando la persona quiera. Nada sale del dispositivo.
 */
export const SMART_REMINDERS_VERSION = 1;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const sentNudgeSchema = z.object({
  date: z.string().regex(ISO_DATE),
  slot: z.enum([...NUDGE_SLOTS, "pause"]),
  messageId: z.string().min(1),
});
export type SentNudge = z.infer<typeof sentNudgeSchema>;

const smartRemindersSchema = z.object({
  version: z.literal(SMART_REMINDERS_VERSION),
  /** Aviso al conectarse a Wi-Fi si quedan misiones (app abierta y, en Android, en segundo plano). */
  wifiNudges: z.boolean().catch(false),
  /** Pausa activa tras ~10 min seguidos con la app en pantalla (dentro de la app, sin notificación). */
  activeBreaks: z.boolean().catch(false),
  /** "Silenciar hoy": fecha de Lima en que no se envía ningún aviso de contexto. */
  silencedOn: z.string().regex(ISO_DATE).nullable().catch(null),
  /** Avisos de contexto enviados (últimos días): topes, insistencia y rotación. */
  sent: z.array(sentNudgeSchema).catch([]),
});
export type SmartRemindersSettings = z.infer<typeof smartRemindersSchema>;

export const DEFAULT_SMART_REMINDERS: SmartRemindersSettings = {
  version: SMART_REMINDERS_VERSION,
  wifiNudges: false,
  activeBreaks: false,
  silencedOn: null,
  sent: [],
};

export function parseSmartReminders(raw: unknown): SmartRemindersSettings | null {
  const parsed = smartRemindersSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const smartRemindersStore = createPersistentStore<SmartRemindersSettings>(
  "artikare_smart_reminders_v1",
  DEFAULT_SMART_REMINDERS,
  parseSmartReminders
);

const SENT_HISTORY_LIMIT = 30;

function update(changes: (current: SmartRemindersSettings) => SmartRemindersSettings): void {
  if (smartRemindersStore.hasUnreadableData()) return;
  smartRemindersStore.write(changes(smartRemindersStore.getSnapshot()));
}

export function setTrigger(trigger: "wifiNudges" | "activeBreaks", enabled: boolean): void {
  update((current) => ({ ...current, [trigger]: enabled }));
}

export function silenceToday(today: string = toLimaIsoDate()): void {
  update((current) => ({ ...current, silencedOn: today }));
}

export function unsilence(): void {
  update((current) => ({ ...current, silencedOn: null }));
}

export function recordNudgeSent(entry: SentNudge): void {
  update((current) => ({ ...current, sent: [...current.sent, entry].slice(-SENT_HISTORY_LIMIT) }));
}
