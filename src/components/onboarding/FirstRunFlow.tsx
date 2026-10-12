"use client";

import { useCallback, useEffect, useState } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { GameButton } from "@/components/ui/GameButton";
import { patientProfileStore, savePatientProfile } from "@/lib/dashboard/patientProfile";
import { completeOnboarding, startOnboarding, type Intensity, type ProfileStepValue } from "@/lib/onboarding/onboarding";
import { createConsentRecord } from "@/lib/privacy/consent";
import { ConsentStep } from "./ConsentStep";
import { GoalsStep } from "./GoalsStep";
import { SplashStep, WELCOME_SCREEN_COUNT, WelcomeStep } from "./IntroSteps";
import { ProfileStep } from "./ProfileStep";
import { StepHeading } from "./StepHeading";
import { StepProgress } from "./StepProgress";

type Step =
  | { kind: "splash" }
  | { kind: "welcome"; index: number }
  | { kind: "consent" }
  | { kind: "profile" }
  | { kind: "goals" }
  | { kind: "arrival"; intensity: Intensity; firstName: string | null };

/** Bienvenida (N pantallas) + consentimiento + perfil + metas. Splash y llegada no cuentan. */
const PROGRESS_TOTAL = WELCOME_SCREEN_COUNT + 3;

function progressStep(step: Step): number | null {
  switch (step.kind) {
    case "welcome":
      return step.index + 1;
    case "consent":
      return WELCOME_SCREEN_COUNT + 1;
    case "profile":
      return WELCOME_SCREEN_COUNT + 2;
    case "goals":
      return WELCOME_SCREEN_COUNT + 3;
    default:
      return null;
  }
}

function saveFirstRunProfile(value: ProfileStepValue): void {
  savePatientProfile({ ...patientProfileStore.getSnapshot(), ...value, consent: createConsentRecord() });
}

function ArrivalStep({ firstName, onEnter }: { firstName: string | null; onEnter: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <ArtikoMascot emotion="celebrating" size={200} decorative />
      <StepHeading>{firstName ? `¡Todo listo, ${firstName}! 🎉` : "¡Todo listo! 🎉"}</StepHeading>
      <p className="text-xl">Tus misiones de hoy te esperan. Empieza por la que quieras.</p>
      <GameButton tone="vital" size="xl" block haptic="success" onClick={onEnter}>
        Ir a Hoy ☀️
      </GameButton>
    </div>
  );
}

/**
 * Primer arranque de /app, una sola vez y sin cuenta: splash → bienvenida →
 * consentimiento → perfil → metas → llegada. Negarse a dar datos salta el perfil.
 */
export function FirstRunFlow() {
  const [step, setStep] = useState<Step>({ kind: "splash" });
  useEffect(() => startOnboarding(), []);
  const endSplash = useCallback(() => setStep((current) => (current.kind === "splash" ? { kind: "welcome", index: 0 } : current)), []);

  function nextWelcome(index: number) {
    setStep(index + 1 < WELCOME_SCREEN_COUNT ? { kind: "welcome", index: index + 1 } : { kind: "consent" });
  }

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

  return (
    <div className="ambient-canvas fixed inset-0 z-[60] overflow-y-auto">
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8 text-lg">
        {progressStep(step) !== null && <StepProgress current={progressStep(step)!} total={PROGRESS_TOTAL} />}
        {step.kind === "welcome" && <WelcomeStep key={step.index} index={step.index} onNext={() => nextWelcome(step.index)} />}
        {step.kind === "consent" && (
          <ConsentStep onAccept={() => setStep({ kind: "profile" })} onDecline={() => setStep({ kind: "goals" })} />
        )}
        {step.kind === "profile" && (
          <ProfileStep
            onSave={(value) => {
              saveFirstRunProfile(value);
              setStep({ kind: "goals" });
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
