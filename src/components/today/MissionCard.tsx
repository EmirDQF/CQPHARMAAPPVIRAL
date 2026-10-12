"use client";

import { GameButton } from "@/components/ui/GameButton";
import type { Activity, ActivityKind } from "@/lib/activities/schemas";

const ACTION_LABEL: Readonly<Record<ActivityKind, string>> = {
  "check-in": "Registrar",
  dose: "Anotar toma",
  guided: "Empezar",
  "self-report": "¡Lo hice!",
  quiz: "Responder",
  share: "Compartir",
};

interface MissionCardProps {
  activity: Activity;
  isDone: boolean;
  /** Recién completada en esta sesión: muestra el +XP flotante. */
  justEarned: boolean;
  onAction: () => void;
  /** Solo para autorreportes: corrige un toque por error. */
  onUndo?: () => void;
}

export function MissionCard({ activity, isDone, justEarned, onAction, onUndo }: MissionCardProps) {
  const titleId = `mision-${activity.id}`;
  return (
    <li
      aria-labelledby={titleId}
      className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-4 transition-colors ${
        isDone ? "border-vital-deep bg-pastel-mint text-pastel-mint-ink" : "border-line bg-surface"
      }`}
    >
      <span
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-canvas text-4xl easy-read:size-20 easy-read:text-5xl"
      >
        {isDone ? "✅" : activity.emoji}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 id={titleId} className="text-xl font-black leading-tight easy-read:text-2xl">
          {activity.title}
        </h3>
        <p data-testid="mission-description" className="text-lg easy-read:hidden">
          {activity.description}
        </p>
        <p className="text-lg font-bold">
          <span aria-hidden="true">⏱️ </span>
          {activity.durationMinutes} min · <span className="text-xp-text">+{activity.xp} XP</span>
          {activity.safety === "physical" && <span> · con apoyo</span>}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {isDone ? (
            <>
              <span className="text-lg font-black">¡Hecho!</span>
              {onUndo && (
                <button type="button" onClick={onUndo} className="min-h-12 rounded-xl px-3 font-bold underline">
                  Deshacer
                </button>
              )}
            </>
          ) : (
            <GameButton tone="vital" size="md" aria-describedby={titleId} onClick={onAction}>
              {ACTION_LABEL[activity.kind]}
            </GameButton>
          )}
        </div>
      </div>
      {justEarned && (
        <span aria-hidden="true" className="xp-pop pointer-events-none absolute right-4 top-2 rounded-full border-2 border-xp-deep bg-xp px-3 py-1 text-lg font-black text-xp-ink">
          +{activity.xp} XP ⭐
        </span>
      )}
    </li>
  );
}
