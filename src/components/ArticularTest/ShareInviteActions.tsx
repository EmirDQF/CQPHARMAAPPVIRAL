"use client";

import { useEffect, useRef, useState } from "react";
import { readSiteUrl } from "@/lib/native/appIdentity";
import { browserShareDependencies } from "@/lib/share/browserShare";
import { shareInvite, type InviteAudience, type ShareOutcome } from "@/lib/share/inviteShare";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const OUTCOME_MESSAGES: Readonly<Partial<Record<ShareOutcome, string>>> = {
  shared: "¡Gracias por compartir el test!",
  whatsapp: "Intentamos abrir WhatsApp con la invitación. Si no se abrió, toca de nuevo.",
  failed: "No pudimos abrir las opciones para compartir. Inténtalo de nuevo.",
};

/** Invita a otra persona a hacer el test; nunca comparte el resultado de quien lo hizo. */
export function ShareInviteActions() {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  // La hoja de compartir puede seguir abierta si la tarjeta se desmonta (p. ej. "Volver a hacer el test").
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function handleShare(audience: InviteAudience) {
    const result = await shareInvite(audience, readSiteUrl(), browserShareDependencies());
    if (isMountedRef.current) setOutcome(result);
  }

  const message = outcome ? OUTCOME_MESSAGES[outcome] : undefined;

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <p className="text-lg font-medium">¿Conoces a alguien a quien le sirva? Compartes solo la invitación, no tu resultado.</p>
      <button
        type="button"
        onClick={() => void handleShare("familiar")}
        className={`w-full min-h-12 rounded-xl border-2 border-brand text-clinic font-semibold px-4 py-3 ${FOCUS_RING}`}
      >
        Invitar a mamá, papá o un familiar
      </button>
      <button
        type="button"
        onClick={() => void handleShare("autoevaluacion")}
        className={`w-full min-h-12 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 font-semibold px-4 py-3 ${FOCUS_RING}`}
      >
        Compartir el test
      </button>
      <p role="status" className="text-lg text-muted min-h-5">
        {message}
      </p>
    </div>
  );
}
