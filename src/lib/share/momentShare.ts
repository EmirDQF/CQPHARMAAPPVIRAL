import { z } from "zod";
import { GAME_UNLOCKS } from "../gamification/unlocks";
import { MASCOT } from "../mascot/mascot";
import type { ShareChannel, SharePayload } from "./inviteShare";

/**
 * Momentos compartibles con Artiko (viralidad ética). La tarjeta lleva marca y
 * descargo y NUNCA datos de salud, nombre ni T-score: solo días activos o una
 * insignia por constancia, más una invitación al test. Compartir siempre es
 * una decisión de la persona (botón + vista previa con "Ahora no").
 */
const MAX_SHAREABLE_DAYS = 3650;
const shareableUnlockIds = GAME_UNLOCKS.filter((unlock) => unlock.shareable).map((unlock) => unlock.id) as [string, ...string[]];

export const shareMomentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("streak"), days: z.number().int().min(1).max(MAX_SHAREABLE_DAYS) }),
  z.object({ kind: z.literal("badge"), unlockId: z.enum(shareableUnlockIds) }),
  z.object({ kind: z.literal("invite-parent") }),
]);
export type ShareMoment = z.infer<typeof shareMomentSchema>;

export const SHARE_DISCLAIMER = "Artikare acompaña tu constancia; no reemplaza la consulta con tu médico.";
const SHARE_TITLE = "Artikare · con Artiko";

const CAMPAIGN: Readonly<Record<ShareMoment["kind"], string>> = {
  streak: "racha",
  badge: "logro",
  "invite-parent": "derivacion-familiar",
};

export interface ShareCard {
  emoji: string;
  headline: string;
  body: string;
  disclaimer: string;
}

function badgeOf(unlockId: string) {
  const unlock = GAME_UNLOCKS.find((item) => item.id === unlockId);
  if (!unlock) throw new Error(`Insignia desconocida: ${unlockId}`);
  return unlock;
}

/** Contenido visible de la tarjeta (vista previa y texto compartido). */
export function buildShareCard(moment: ShareMoment): ShareCard {
  const parsed = shareMomentSchema.parse(moment);
  switch (parsed.kind) {
    case "streak":
      return {
        emoji: "🔥",
        headline: `¡Mi racha de ${parsed.days} ${parsed.days === 1 ? "día" : "días"}!`,
        body: `Me cuido un poquito cada día con ${MASCOT.name}. ¿Te animas? Haz el test orientativo de 2 minutos.`,
        disclaimer: SHARE_DISCLAIMER,
      };
    case "badge": {
      const unlock = badgeOf(parsed.unlockId);
      return {
        emoji: unlock.emoji,
        headline: `¡Gané la insignia “${unlock.title}”!`,
        body: `La gané por constancia con ${MASCOT.name}. ¿Te animas? Haz el test orientativo de 2 minutos.`,
        disclaimer: SHARE_DISCLAIMER,
      };
    }
    case "invite-parent":
      return {
        emoji: "💌",
        headline: "Me importa cómo estás",
        body: "Encontré un test orientativo de articulaciones y huesos que dura 2 minutos. Hazlo y lo conversamos.",
        disclaimer: SHARE_DISCLAIMER,
      };
  }
}

/** Enlace al test con UTM de derivación (solo valores simples que acepta deepLinks.ts). */
export function buildMomentUrl(siteUrl: string, moment: ShareMoment, channel: ShareChannel): string {
  const url = new URL("/test", siteUrl);
  url.search = new URLSearchParams({ utm_source: channel, utm_medium: "compartir", utm_campaign: CAMPAIGN[moment.kind] }).toString();
  return url.href;
}

export function buildMomentPayload(moment: ShareMoment, siteUrl: string): SharePayload {
  const card = buildShareCard(moment);
  return {
    title: SHARE_TITLE,
    text: `${card.emoji} ${card.headline} ${card.body} ${card.disclaimer}`,
    urlFor: (channel) => buildMomentUrl(siteUrl, moment, channel),
  };
}
