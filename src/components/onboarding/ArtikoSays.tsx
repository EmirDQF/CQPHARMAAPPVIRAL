import type { ReactNode } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import type { ArtikoEmotion } from "@/lib/mascot/mascot";
import { StepHeading } from "./StepHeading";

interface ArtikoSaysProps {
  emotion: ArtikoEmotion;
  /** La pregunta o el mensaje del paso: es el título (h1) que recibe el foco. */
  children: ReactNode;
  /** Aclaración corta bajo la pregunta, dentro del mismo globo. */
  hint?: ReactNode;
}

/** Artiko acompaña cada paso del primer arranque con un globo de diálogo que contiene la pregunta actual. */
export function ArtikoSays({ emotion, children, hint }: ArtikoSaysProps) {
  return (
    <div className="flex items-end gap-3">
      <ArtikoMascot emotion={emotion} size={104} decorative className="shrink-0" />
      <div className="relative mb-6 flex-1 rounded-card border-2 border-line bg-surface px-4 py-3 shadow-soft">
        <StepHeading>{children}</StepHeading>
        {hint && <p className="mt-1 text-lg text-muted">{hint}</p>}
        <span
          aria-hidden="true"
          className="absolute -left-2 bottom-5 size-4 rotate-45 border-b-2 border-l-2 border-line bg-surface"
        />
      </div>
    </div>
  );
}
