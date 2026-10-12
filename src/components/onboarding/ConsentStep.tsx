"use client";

import { useState } from "react";
import { ConsentCheckbox } from "@/components/privacy/ConsentCheckbox";
import { GameButton } from "@/components/ui/GameButton";
import { PRIVACY_POLICY_PATH } from "@/lib/privacy/consent";
import { StepHeading } from "./StepHeading";

const DATA_FACTS: readonly { emoji: string; title: string; body: string }[] = [
  { emoji: "📝", title: "Qué datos", body: "Tu nombre o apodo, tu edad (a partir de tu fecha de nacimiento) y tu sexo. Todo opcional salvo el nombre." },
  { emoji: "🦴", title: "Para qué", body: "Para saludarte y para que el Semáforo Óseo use la regla correcta, que depende de la edad y el sexo." },
  { emoji: "📱", title: "Dónde se guardan", body: "Solo en este celular. Se copian a tu cuenta únicamente si un día la creas y lo autorizas." },
  { emoji: "🗑️", title: "Cómo borrarlos", body: "Cuando quieras, en Ajustes → Borrar mi cuenta y mis datos." },
];

interface ConsentStepProps {
  onAccept: () => void;
  onDecline: () => void;
}

/** Ley 29733: consentimiento explícito ANTES de pedir datos personales; negarse no bloquea la app. */
export function ConsentStep({ onAccept, onDecline }: ConsentStepProps) {
  const [hasConsented, setHasConsented] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <StepHeading>Tus datos, tus reglas 🔒</StepHeading>
      <ul className="flex flex-col gap-3">
        {DATA_FACTS.map((fact) => (
          <li key={fact.title} className="flex gap-3 rounded-2xl bg-surface p-4 shadow-soft">
            <span aria-hidden="true" className="text-3xl">
              {fact.emoji}
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-black">{fact.title}</span>
              <span className="text-lg">{fact.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <a href={PRIVACY_POLICY_PATH} target="_blank" rel="noopener noreferrer" className="min-h-12 flex items-center text-lg font-bold text-clinic underline">
        Leer la Política de Privacidad completa
      </a>
      <ConsentCheckbox checked={hasConsented} onChange={setHasConsented} />
      <GameButton
        tone="vital"
        size="xl"
        block
        aria-disabled={!hasConsented}
        aria-describedby={hasConsented ? undefined : "consent-required-hint"}
        onClick={onAccept}
      >
        Acepto y sigo ✅
      </GameButton>
      {!hasConsented && (
        <p id="consent-required-hint" className="text-base text-muted">
          Para seguir con tu perfil, marca primero la autorización.
        </p>
      )}
      <GameButton tone="surface" size="lg" block haptic={false} onClick={onDecline}>
        Prefiero no dar mis datos
      </GameButton>
    </div>
  );
}
