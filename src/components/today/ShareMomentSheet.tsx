"use client";

import { useState } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GameButton } from "@/components/ui/GameButton";
import { readSiteUrl } from "@/lib/native/appIdentity";
import { browserShareDependencies } from "@/lib/share/browserShare";
import { shareContent, type ShareOutcome } from "@/lib/share/inviteShare";
import { buildMomentPayload, buildShareCard, type ShareMoment } from "@/lib/share/momentShare";

const OUTCOME_TEXT: Readonly<Partial<Record<ShareOutcome, string>>> = {
  shared: "¡Gracias por compartir! 💌",
  whatsapp: "Abrimos WhatsApp con tu mensaje. Si no se abrió, toca de nuevo.",
  failed: "No pudimos abrir las opciones para compartir. Inténtalo otra vez.",
};

interface ShareMomentSheetProps {
  moment: ShareMoment;
  onShared?: () => void;
  onClose: () => void;
}

/** Vista previa de la tarjeta (marca + descargo, sin datos de salud) antes de compartir. Nada se envía sin tocar "Compartir". */
export function ShareMomentSheet({ moment, onShared, onClose }: ShareMomentSheetProps) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const card = buildShareCard(moment);

  async function share() {
    const result = await shareContent(buildMomentPayload(moment, readSiteUrl()), browserShareDependencies());
    setOutcome(result);
    if (result === "shared" || result === "whatsapp") onShared?.();
  }

  return (
    <BottomSheet title="Compartir con Artiko" onClose={onClose}>
      <figure aria-label="Vista previa de la tarjeta" className="flex flex-col items-center gap-2 rounded-2xl bg-vital px-4 py-5 text-center text-vital-ink">
        <ArtikoMascot emotion="celebrating" size={110} decorative />
        <p className="text-3xl font-black">
          <span aria-hidden="true">{card.emoji} </span>
          {card.headline}
        </p>
        <p className="text-lg font-bold">{card.body}</p>
        <figcaption className="text-sm font-bold">Artikare · {card.disclaimer}</figcaption>
      </figure>
      <p className="text-base text-muted">Solo se comparte esta tarjeta y un enlace al test. Nunca tus registros ni tu nombre.</p>
      {outcome && OUTCOME_TEXT[outcome] && (
        <p role="status" className="text-lg font-bold">
          {OUTCOME_TEXT[outcome]}
        </p>
      )}
      <GameButton tone="vital" block onClick={() => void share()}>
        Compartir 📤
      </GameButton>
      <GameButton tone="surface" size="md" block haptic={false} onClick={onClose}>
        Ahora no
      </GameButton>
    </BottomSheet>
  );
}
