"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useActiveRedFlags } from "@/components/dashboard/useActiveRedFlags";
import { LearningRewardModal } from "@/components/rewards/LearningRewardModal";
import { useLearningReward } from "@/hooks/useLearningReward";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { limaDayNumber } from "@/lib/motivation/phrases";
import { miniGameScoresStore, visibleGames, type MiniGame } from "@/lib/gamification/miniGames";
import { GamePlayer } from "./GamePlayer";

const SEED_DAY_FACTOR = 1000;

interface GamesHubProps {
  /** Logros y colección (se muestran bajo los juegos). */
  achievements?: ReactNode;
}

interface Session {
  game: MiniGame;
  seed: number;
}

function GameCard({ game, best, onPlay }: { game: MiniGame; best: string | null; onPlay: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onPlay}
        className="press-scale flex min-h-24 w-full items-center gap-3 rounded-card border-2 border-line bg-surface p-4 text-left shadow-soft"
      >
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-pastel-mint text-3xl">
          {game.emoji}
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-xl font-black text-clinic">{game.title}</span>
          <span className="text-lg text-muted">{game.description}</span>
          <span className="text-base text-muted">
            {game.minutes} min · sin reloj{best ? ` · Mejor: ${best}` : ""}
          </span>
        </span>
      </button>
    </li>
  );
}

/** "Jugar": mini-juegos educativos (1–3 min, sin presión de tiempo) y los logros. */
export function GamesHub({ achievements }: GamesHubProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const now = useMinuteClock();
  const hasRedFlag = useActiveRedFlags().length > 0;
  const scores = useSyncExternalStore(miniGameScoresStore.subscribe, miniGameScoresStore.getSnapshot, miniGameScoresStore.getServerSnapshot);
  const { reward, complete, dismiss } = useLearningReward();
  const games = visibleGames(hasRedFlag);

  // Semilla distinta por día de Lima y por partida: cada repetición baraja otras cartas.
  function start(game: MiniGame) {
    const day = now ? limaDayNumber(now) : 0;
    setSession({ game, seed: day * SEED_DAY_FACTOR + playCount + 1 });
    setPlayCount((count) => count + 1);
  }

  if (session) {
    return (
        <GamePlayer
          key={session.seed}
          game={session.game}
          seed={session.seed}
          onExit={() => setSession(null)}
          onReplay={() => start(session.game)}
          onFinish={() => {
            setSession(null);
            complete("game", session.game.id, `“${session.game.title}”`);
          }}
        />
    );
  }

  return (
    <section aria-labelledby="jugar-titulo" className="flex flex-col gap-5">
      <h1 id="jugar-titulo" className="text-3xl font-black text-clinic">
        Jugar <span aria-hidden="true">🎮</span>
      </h1>
      <p className="text-lg text-muted">Juegos cortos para aprender sobre huesos y articulaciones, a tu ritmo y sin reloj.</p>
      {hasRedFlag && (
        <p className="rounded-control bg-pastel-peach px-4 py-3 text-lg text-pastel-peach-ink">
          Mientras tu médico te evalúa, ocultamos los juegos que hablan de movimiento.
        </p>
      )}
      <ul className="grid gap-3">
        {games.map((game) => {
          const best = scores.best[game.id];
          return <GameCard key={game.id} game={game} best={best ? `${best.correct}/${best.total}` : null} onPlay={() => start(game)} />;
        })}
      </ul>
      {achievements}
      {reward && <LearningRewardModal reward={reward} onClose={dismiss} />}
    </section>
  );
}
