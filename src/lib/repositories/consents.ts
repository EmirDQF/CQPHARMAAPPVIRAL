import { z } from "zod";
import { CONSENT_PURPOSES, consentInsertSchema, type ConsentInsert } from "../schemas/consent";
import { timestampSchema } from "../schemas/shared";
import { selectRows, type RepositoryClient } from "./supabaseRows";
import { RepositoryError } from "./types";

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];

/** `consents` solo admite filas nuevas: una revocación es otra fila con `revoked_at`. */
export interface ConsentRepository {
  /** Un consentimiento inválido falla: perderlo en silencio rompería la garantía legal. */
  record(consent: ConsentInsert): Promise<void>;
  hasActive(purpose: ConsentPurpose): Promise<boolean>;
}

const TABLE = "consents";
const consentEventSchema = z.object({
  purpose: z.enum(CONSENT_PURPOSES),
  granted_at: timestampSchema,
  revoked_at: timestampSchema.nullable(),
});

type ConsentEvent = z.infer<typeof consentEventSchema>;

function eventTime(event: ConsentEvent): number {
  return Date.parse(event.revoked_at ?? event.granted_at);
}

/**
 * Vigente si el último evento de esa finalidad es un consentimiento y no una
 * revocación. Ante un empate de horas gana la revocación (lo más prudente).
 */
export function isConsentActive(events: readonly ConsentEvent[], purpose: ConsentPurpose): boolean {
  const latest = events
    .filter((event) => event.purpose === purpose)
    .reduce<ConsentEvent | null>((current, event) => {
      if (!current) return event;
      const difference = eventTime(event) - eventTime(current);
      if (difference !== 0) return difference > 0 ? event : current;
      return event.revoked_at !== null ? event : current;
    }, null);
  return latest !== null && latest.revoked_at === null;
}

export function createSupabaseConsentRepository(client: RepositoryClient): ConsentRepository {
  return {
    async record(consent) {
      const parsed = consentInsertSchema.safeParse(consent);
      if (!parsed.success) throw new RepositoryError(`validar ${TABLE}`);
      const { error } = await client.from(TABLE).insert(parsed.data);
      if (error) throw new RepositoryError(`guardar ${TABLE}`, { cause: error });
    },
    async hasActive(purpose) {
      const events = await selectRows(client, TABLE, "purpose, granted_at, revoked_at", consentEventSchema);
      return isConsentActive(events, purpose);
    },
  };
}
