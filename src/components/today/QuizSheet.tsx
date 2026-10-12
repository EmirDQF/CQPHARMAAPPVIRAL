"use client";

import Link from "next/link";
import { useState } from "react";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GameButton } from "@/components/ui/GameButton";
import type { Activity } from "@/lib/activities/schemas";

interface QuizSheetProps {
  activity: Activity;
  onComplete: () => void;
  onClose: () => void;
}

/** Una pregunta y su explicación. Responder suma XP siempre: aprender no tiene castigo. */
export function QuizSheet({ activity, onComplete, onClose }: QuizSheetProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  const quiz = activity.quiz;
  if (!quiz) return null;
  const isRight = chosen === quiz.answerIndex;

  return (
    <BottomSheet title={`${activity.emoji} ${activity.title}`} onClose={onClose}>
      <div className="flex items-center gap-3">
        <ArtikoMascot emotion={chosen === null ? "thinking" : "happy"} size={80} decorative />
        <p className="flex-1 text-xl font-black">{quiz.question}</p>
      </div>
      <div role="group" aria-label="Opciones" className="flex flex-col gap-3">
        {quiz.options.map((option, index) => (
          <GameButton
            key={option}
            tone={chosen === null ? "surface" : index === quiz.answerIndex ? "vital" : "surface"}
            block
            aria-pressed={chosen === index}
            aria-disabled={chosen !== null}
            onClick={() => setChosen(index)}
          >
            {option}
            {chosen !== null && index === quiz.answerIndex && <span aria-hidden="true"> ✅</span>}
          </GameButton>
        ))}
      </div>
      {chosen !== null && (
        <div role="status" className="flex flex-col gap-2 rounded-2xl bg-pastel-sky px-4 py-3 text-pastel-sky-ink">
          <p className="text-lg font-black">{isRight ? "¡Bien! 🎉" : "Casi. Mira por qué:"}</p>
          <p className="text-lg">{quiz.explanation}</p>
          {quiz.articleSlug && (
            <Link href={`/blog/${quiz.articleSlug}`} className="min-h-12 flex items-center font-bold underline">
              Leer el artículo completo
            </Link>
          )}
        </div>
      )}
      {chosen !== null && (
        <GameButton tone="vital" block haptic="success" onClick={onComplete}>
          Listo, sumar a mis misiones ⭐
        </GameButton>
      )}
    </BottomSheet>
  );
}
