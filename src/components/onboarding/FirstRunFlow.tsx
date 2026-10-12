"use client";

import { useCallback, useEffect, useState } from "react";
import { GameButton } from "@/components/ui/GameButton";
import { patientProfileStore, savePatientProfile } from "@/lib/dashboard/patientProfile";
import {
  completeOnboarding,
  profileQuestions,
  startOnboarding,
  type Intensity,
  type ProfileDraft,
} from "@/lib/onboarding/onboarding";
import { createConsentRecord } from "@/lib/privacy/consent";
import { ArtikoSays } from "./ArtikoSays";
import { ConsentStep } from "./ConsentStep";
import { GoalsStep } from "./GoalsStep";
import { SplashStep, WelcomeStep } from "./IntroSteps";
import { ProfileStep } from "./ProfileStep";
import { StepProgress } from "./StepProgress";

type Step =
  | { kind: "splash" }
  | { kind: "welcome" }
  | { kind: "consent" }
  | { kind: "profile"; question: number; questionCount: number }
  | { kind: "goals"; questionCount: number }
  | { kind: "arrival"; intensity: Intensity; firstName: string | null };

/** Avance visible: bienvenida (1) + consentimiento (2) + una por pregunta del perfil + metas. Splash y llegada no cuentan. */
function progressOf(step: Step): { current: number; total: number } | null {
  const defaultQuestions = profileQuestions({ sex: null }).length;
  switch (step.kind) {
    case "welcome":
      return { current: 1, total: defaultQuestions + 3 };
    case "consent":
      return { current: 2, total: defaultQuestions + 3 };
    case "profile":
      return { current: 3 + step.question, total: step.questionCount + 3 };
    case "goals":
      return { current: step.questionCount + 3, total: step.questionCount + 3 };
    default:
      return null;
  }
}

/** Solo se llama tras aceptar el consentimiento: sin él, nada de salud llega al celular. */
function saveFirstRunProfile(draft: ProfileDraft): void {
  savePatientProfile({ ...patientProfileStore.getSnapshot(), ...draft, consent: createConsentRecord() });
}

function ArrivalStep({ firstName, onEnter }: { firstName: string | null; onEnter: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <ArtikoSays emotion="celebrating">{firstName ? `¡Todo listo, ${firstName}!` : "¡Todo listo!"}</ArtikoSays>
      <p className="text-xl">Tus misiones de hoy te esperan. Empieza por la que quieras.</p>
      <GameButton tone="vital" size="xl" block haptic="success" onClick={onEnter}>
        Ir a Hoy
      </GameButton>
    </div>
  );
}

/**
 * Primer arranque de /app, una sola vez y sin cuenta: splash → bienvenida de
 * Artiko → consentimiento → perfil (una pregunta por pantalla) → metas →
 * llegada. Negarse a dar datos salta el perfil y deja usar la app como invitado.
 */
export function FirstRunFlow() {
  const [step, setStep] = useState<Step>({ kind: "splash" });
  useEffect(() => startOnboarding(), []);
  const endSplash = useCallback(() => setStep((current) => (current.kind === "splash" ? { kind: "welcome" } : current)), []);

  function finishGoals(intensity: Intensity) {
    const name = patientProfileStore.getSnapshot().name.trim();
    setStep({ kind: "arrival", intensity, firstName: name ? name.split(/\s+/)[0] : null });
  }

  if (step.kind === "splash") {
    return (
      <div className="fixed inset-0 z-[60]">
        <SplashStep onDone={endSplash} />
      </div>
    );
  }

  const progress = progressOf(step);
  const defaultQuestionCount = profileQuestions({ sex: null }).length;

  return (
    <div className="ambient-canvas fixed inset-0 z-[60] overflow-y-auto">
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8 text-lg">
        {progress && <StepProgress current={progress.current} total={progress.total} />}
        {step.kind === "welcome" && <WelcomeStep onNext={() => setStep({ kind: "consent" })} />}
        {step.kind === "consent" && (
          <ConsentStep
            onAccept={() => setStep({ kind: "profile", question: 0, questionCount: defaultQuestionCount })}
            onDecline={() => setStep({ kind: "goals", questionCount: defaultQuestionCount })}
          />
        )}
        {step.kind === "profile" && (
          <ProfileStep
            onQuestionChange={(question, questionCount) => setStep({ kind: "profile", question, questionCount })}
            onSave={(draft) => {
              saveFirstRunProfile(draft);
              setStep({ kind: "goals", questionCount: profileQuestions(draft).length });
            }}
          />
        )}
        {step.kind === "goals" && <GoalsStep onDone={finishGoals} />}
        {step.kind === "arrival" && (
          <ArrivalStep firstName={step.firstName} onEnter={() => completeOnboarding(step.intensity)} />
        )}
      </main>
    </div>
  );
}
