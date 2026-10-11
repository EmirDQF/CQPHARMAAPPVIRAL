/**
 * Invitar a otra persona a hacer el test (motor viral ético). El mensaje es
 * solo una invitación: nunca lleva el resultado, la edad ni datos de salud de
 * quien comparte. Copy sin miedo ni culpa y sin promesas (forbiddenCopy).
 */
export type InviteAudience = "familiar" | "autoevaluacion";
export type ShareChannel = "app" | "web" | "whatsapp";
export type ShareOutcome = "shared" | "cancelled" | "whatsapp" | "failed";

export const INVITE_COPY: Readonly<Record<InviteAudience, string>> = {
  familiar:
    "Hola, encontré un test orientativo de articulaciones y huesos que dura 2 minutos. Me importa cómo estás: hazlo aquí y lo conversamos.",
  autoevaluacion:
    "Encontré el test orientativo de edad articular de Artikare; dura 2 minutos. Si quieres una orientación rápida sobre tus articulaciones y huesos, hazlo aquí.",
};

const UTM_CAMPAIGN: Readonly<Record<InviteAudience, string>> = {
  familiar: "derivacion-familiar",
  autoevaluacion: "autoevaluacion",
};

export function buildInviteUrl(siteUrl: string, audience: InviteAudience, channel: ShareChannel): string {
  const url = new URL("/test", siteUrl);
  url.search = new URLSearchParams({
    utm_source: channel,
    utm_medium: "compartir",
    utm_campaign: UTM_CAMPAIGN[audience],
  }).toString();
  return url.href;
}

export function buildWhatsAppShareLink(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
}

export interface ShareDependencies {
  isNativeApp: () => boolean;
  /** @capacitor/share; se carga solo en la app nativa. */
  nativeShare: (payload: { title: string; text: string; url: string }) => Promise<void>;
  /** navigator.share si el navegador lo ofrece. */
  webShare?: (payload: { title: string; text: string; url: string }) => Promise<void>;
  openUrl: (url: string) => void;
}

const SHARE_TITLE = "Test de edad articular · Artikare";

function isCancellation(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || /cancel/i.test(error.message));
}

async function tryShare(share: () => Promise<void>): Promise<ShareOutcome> {
  try {
    await share();
    return "shared";
  } catch (error: unknown) {
    return isCancellation(error) ? "cancelled" : "failed";
  }
}

/** Nativo → navigator.share → WhatsApp. Cancelar no abre otra vía. */
export async function shareInvite(
  audience: InviteAudience,
  siteUrl: string,
  deps: ShareDependencies
): Promise<ShareOutcome> {
  const text = INVITE_COPY[audience];
  if (deps.isNativeApp()) {
    const url = buildInviteUrl(siteUrl, audience, "app");
    return tryShare(() => deps.nativeShare({ title: SHARE_TITLE, text, url }));
  }
  if (deps.webShare) {
    const webShare = deps.webShare;
    const url = buildInviteUrl(siteUrl, audience, "web");
    const outcome = await tryShare(() => webShare({ title: SHARE_TITLE, text, url }));
    if (outcome !== "failed") return outcome;
  }
  deps.openUrl(buildWhatsAppShareLink(text, buildInviteUrl(siteUrl, audience, "whatsapp")));
  return "whatsapp";
}
