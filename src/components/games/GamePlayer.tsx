"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { memoryDeck, mythCards, plateFoods, quizCards, shieldCards } from "@/lib/gamification/gameRounds";
import { miniGameScoresStore, recordGameResult, type GameScore, type MiniGame } from "@/lib/gamification/miniGames";
import { RHEUMA_EDUCATION } from "@/lib/gamification/rheumaEducationData";
import { ChoiceRoundGame } from "./ChoiceRoundGame";
import { GameResult } from "./GameResult";
import { MemoryGame } from "./MemoryGame";
import { PlateGame } from "./PlateGame";
import { SafeHomeGame } from "./SafeHomeGame";

interface GamePlayerProps {
  game: MiniGame;
  seed: number;
  onExit: () => void;
  onReplay: () => void;
  onFinish: (score: GameScore) => void;
}

/** Arma la partida del juego elegido según su nivel y muestra el resultado al final. */
export function GamePlayer({ game, seed, onExit, onReplay, onFinish }: GamePlayerProps) {
  const scores = useSyncExternalStore(miniGameScoresStore.subscribe, miniGameScoresStore.getSnapshot, miniGameScoresStore.getServerSnapshot);
  // El nivel se fija al empezar: subirlo a mitad de partida no cambia las cartas.
  const [level] = useState(() => scores.level[game.id] ?? 1);
  const [result, setResult] = useState<GameScore | null>(null);
  // La partida se arma una sola vez por (nivel, semilla): un re-render nunca rebaraja las cartas.
  const round = useMemo(
    () => ({
      myths: mythCards(level, seed),
      shield: shieldCards(level, seed),
      quiz: quizCards(level, seed),
      plate: plateFoods(seed),
      memory: memoryDeck(level, seed),
    }),
    [level, seed]
  );

  function endRound(score: GameScore) {
    recordGameResult(game.id, score);
    setResult(score);
  }

  if (result) {
    return <GameResult score={result} best={scores.best[game.id]} onReplay={onReplay} onFinish={() => onFinish(result)} />;
  }

  const common = { onExit, onRoundEnd: endRound };
  switch (game.id) {
    case "mito-o-realidad":
      return <ChoiceRoundGame title={game.title} cards={round.myths} {...common} />;
    case "escudo-oseo":
      return <ChoiceRoundGame title={game.title} cards={round.shield} {...common} />;
    case "quiz-reumatologia":
      return <ChoiceRoundGame title={`${game.title} · Nivel ${level}`} cards={round.quiz} {...common} />;
    case "arma-tu-plato":
      return <PlateGame foods={round.plate} {...common} />;
    case "casa-segura":
      return <SafeHomeGame spots={RHEUMA_EDUCATION.home} {...common} />;
    case "memoria-articular":
      return <MemoryGame pairs={round.memory.pairs} cards={round.memory.cards} {...common} />;
  }
}
