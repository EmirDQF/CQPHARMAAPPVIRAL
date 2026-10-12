import { isNativeApp } from "../native/doseNotifications";
import type { ShareDependencies } from "./inviteShare";

async function shareWithCapacitor(payload: { title: string; text: string; url: string }): Promise<void> {
  const { Share } = await import("@capacitor/share");
  await Share.share({ ...payload, dialogTitle: payload.title });
}

/** Compartir real: @capacitor/share en la app, navigator.share en el navegador y WhatsApp como respaldo. */
export function browserShareDependencies(): ShareDependencies {
  const canWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  return {
    isNativeApp,
    nativeShare: shareWithCapacitor,
    webShare: canWebShare ? (payload) => navigator.share(payload) : undefined,
    openUrl: (url) => window.open(url, "_blank", "noopener,noreferrer"),
  };
}
