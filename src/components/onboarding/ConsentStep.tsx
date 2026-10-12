"use client";

import { Bone, NotebookPen, Smartphone, Trash2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ConsentCheckbox } from "@/components/privacy/ConsentCheckbox";
import { GameButton } from "@/components/ui/GameButton";
import { PRIVACY_POLICY_PATH } from "@/lib/privacy/consent";
import { ArtikoSays } from "./ArtikoSays";

const DATA_FACTS: readonly { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: NotebookPen,
    title: "Qué datos",
    body: "Tu nombre o apodo, tu edad, tu sexo, la menopausia y si tuviste una fractura. Todo opcional salvo el nombre.",
  },
  { icon: Bone, title: "Para qué", body: "Para saludarte y para que el Semáforo Óseo use la regla correcta, que depende de la edad y el sexo." },
  { icon: Smartphone, title: "Dónde se guardan", body: "Solo en este celular. Se copian a tu cuenta únicamente si un día la creas y lo autorizas." },
  { icon: Trash2, title: "Cómo borrarlos", body: "Cuando quieras, en Ajustes → Borrar mi cuenta y mis datos." },
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
      <ArtikoSays emotion="thinking" hint="Antes de preguntarte nada, te cuento qué guardo y para qué.">
        Tus datos, tus reglas
      </ArtikoSays>
      <ul className="flex flex-col gap-3">
        {DATA_FACTS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-card bg-surface p-4 shadow-soft">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pastel-sky text-pastel-sky-ink">
              <Icon className="size-6" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-black">{title}</span>
              <span className="text-lg">{body}</span>
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
        Acepto y sigo
      </GameButton>
      {!hasConsented && (
        <p id="consent-required-hint" className="text-lg text-muted">
          Para seguir con tu perfil, marca primero la autorización.
        </p>
      )}
      <GameButton tone="surface" size="lg" block haptic={false} onClick={onDecline}>
        Prefiero no dar mis datos
      </GameButton>
      <p className="text-lg text-muted">Si no los das, usas la app como invitado: nada se guarda en la nube.</p>
    </div>
  );
}
