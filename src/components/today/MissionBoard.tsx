"use client";

import { useEffect, useState } from "react";
import type { GameState } from "@/hooks/useGame";
import { PHYSICAL_ACTIVITY_DISCLAIMER } from "@/lib/activities/catalog";
import type { Activity } from "@/lib/activities/schemas";
import { celebrateGoal } from "@/lib/feedback/celebrate";
import { completeActivity, markGameCelebrated, undoActivity } from "@/lib/gamification/progress";
import { GameButton } from "@/components/ui/GameButton";
import { GuidedActivitySheet } from "./GuidedActivitySheet";
import { MissionCard } from "./MissionCard";
import { QuizSheet } from "./QuizSheet";
import { ShareMomentSheet } from "./ShareMomentSheet";

interface MissionBoardProps {
  game: GameState;
  onTakeDose: (doseId: string) => void;
  onOpenCheckIn: () => void;
}

/** Confeti una sola vez por día al cumplir la meta (también tras recargar). */
function useGoalCelebration(game: GameState): void {
  const key = `goal:${game.today}`;
  const shouldCelebrate = game.goal.met && !game.progress.celebratedKeys.includes(key);
  useEffect(() => {
    if (!shouldCelebrate) return;
    markGameCelebrated([key]);
    void celebrateGoal();
  }, [shouldCelebrate, key]);
}

/** Misiones del día: tocar → completar con su acción real, +XP flotante y confeti al cumplir la meta. */
export function MissionBoard({ game, onTakeDose, onOpenCheckIn }: MissionBoardProps) {
  const [openSheet, setOpenSheet] = useState<Activity | null>(null);
  const [justEarned, setJustEarned] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  useGoalCelebration(game);

  function earn(activity: Activity) {
    if (activity.kind !== "dose" && activity.kind !== "check-in") completeActivity(activity.id, game.today);
    setJustEarned(activity.id);
    setAnnouncement(`${activity.title}: sumaste ${activity.xp} XP.`);
    setOpenSheet(null);
  }

  function act(activity: Activity) {
    switch (activity.kind) {
      case "check-in":
        return onOpenCheckIn();
      case "dose":
        onTakeDose(activity.doseId ?? "");
        return earn(activity);
      case "self-report":
        return earn(activity);
      case "share":
      case "guided":
      case "quiz":
        return setOpenSheet(activity);
    }
  }

  const { nextMission } = game;
  const hasPhysical = game.missions.some((mission) => mission.safety === "physical");
  return (
    <section aria-labelledby="misiones-hoy" className="flex flex-col gap-3">
      <h2 id="misiones-hoy" className="text-3xl font-black text-clinic">
        Misiones de hoy <span aria-hidden="true">🎯</span>
      </h2>
      {nextMission && !game.goal.met && (
        <div className="flex flex-col gap-2 rounded-2xl bg-pastel-mint p-4 text-pastel-mint-ink">
          <p className="text-base font-black uppercase tracking-wide">Tu siguiente paso</p>
          <GameButton tone="vital" size="xl" block onClick={() => act(nextMission)} aria-label={`Siguiente paso: ${nextMission.title}`}>
            {nextMission.title}
          </GameButton>
        </div>
      )}
      {game.goal.met && (
        <p className="rounded-2xl bg-vital px-4 py-3 text-xl font-black text-vital-ink">¡Meta cumplida! 🎉 Todo lo extra es un regalo para ti.</p>
      )}
      <ul className="flex flex-col gap-3">
        {game.missions.map((mission) => (
          <MissionCard
            key={mission.id}
            activity={mission}
            isDone={game.completed.has(mission.id)}
            justEarned={justEarned === mission.id}
            onAction={() => act(mission)}
            onUndo={mission.kind === "self-report" ? () => undoActivity(mission.id, game.today) : undefined}
          />
        ))}
      </ul>
      {hasPhysical && <p className="text-base text-muted">{PHYSICAL_ACTIVITY_DISCLAIMER}</p>}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {openSheet?.kind === "guided" && (
        <GuidedActivitySheet activity={openSheet} onComplete={() => earn(openSheet)} onClose={() => setOpenSheet(null)} />
      )}
      {openSheet?.kind === "share" && (
        <ShareMomentSheet moment={{ kind: "invite-parent" }} onShared={() => earn(openSheet)} onClose={() => setOpenSheet(null)} />
      )}
      {openSheet?.kind === "quiz" && <QuizSheet activity={openSheet} onComplete={() => earn(openSheet)} onClose={() => setOpenSheet(null)} />}
    </section>
  );
}
