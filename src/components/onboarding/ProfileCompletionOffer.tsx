"use client";

import { UserRound } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { PatientProfileModal } from "@/components/dashboard/PatientProfileModal";
import { GameButton } from "@/components/ui/GameButton";
import { patientProfileStore } from "@/lib/dashboard/patientProfile";
import { onboardingStore, shouldOfferProfileCompletion, snoozeProfileOffer } from "@/lib/onboarding/onboarding";

/**
 * Invitado (negó el consentimiento al inicio): Hoy le vuelve a ofrecer completar
 * su perfil. El formulario pide el consentimiento antes de guardar nada.
 */
export function ProfileCompletionOffer() {
  const [isOpen, setIsOpen] = useState(false);
  const onboarding = useSyncExternalStore(onboardingStore.subscribe, onboardingStore.getSnapshot, onboardingStore.getServerSnapshot);
  const profile = useSyncExternalStore(patientProfileStore.subscribe, patientProfileStore.getSnapshot, patientProfileStore.getServerSnapshot);

  if (!isOpen && !shouldOfferProfileCompletion(onboarding, profile)) return null;

  return (
    <section
      aria-labelledby="profile-offer-title"
      className="flex flex-col gap-3 rounded-card border-2 border-line bg-pastel-lavender p-4 text-pastel-lavender-ink"
    >
      <h2 id="profile-offer-title" className="flex items-center gap-2 text-xl font-black">
        <UserRound aria-hidden="true" className="size-6 shrink-0" />
        Estás usando la app como invitado
      </h2>
      <p className="text-lg">
        Si completas tu perfil, el Semáforo Óseo usa la regla correcta para tu edad y sexo. Antes te pediré tu autorización.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <GameButton tone="vital" size="lg" block onClick={() => setIsOpen(true)}>
          Completar mi perfil
        </GameButton>
        <GameButton tone="surface" size="lg" block haptic={false} onClick={() => snoozeProfileOffer()}>
          Ahora no
        </GameButton>
      </div>
      {isOpen && <PatientProfileModal onClose={() => setIsOpen(false)} />}
    </section>
  );
}
