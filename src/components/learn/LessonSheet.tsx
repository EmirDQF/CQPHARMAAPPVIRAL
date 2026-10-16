"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GameButton } from "@/components/ui/GameButton";
import { LEARN_DISCLAIMER, type Lesson } from "@/lib/learn/schemas";

interface LessonSheetProps {
  lesson: Lesson;
  onComplete: () => void;
  onClose: () => void;
}

/** Lección de 1–2 min con su idea clave, preguntas para la consulta y descargo. */
export function LessonSheet({ lesson, onComplete, onClose }: LessonSheetProps) {
  const [showQuestions, setShowQuestions] = useState(false);
  const questionsId = `preguntas-${lesson.id}`;

  return (
    <BottomSheet title={`${lesson.emoji} ${lesson.title}`} onClose={onClose}>
      <p className="text-lg text-muted">Lectura de {lesson.minutes} min</p>
      <div className="flex flex-col gap-3 text-lg">
        {lesson.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p className="rounded-control border-2 border-pastel-mint-edge bg-pastel-mint px-4 py-3 text-lg font-bold text-pastel-mint-ink">
        <span aria-hidden="true">💡 </span>
        {lesson.keyPoint}
      </p>

      <GameButton
        tone="sky"
        block
        aria-expanded={showQuestions}
        aria-controls={questionsId}
        onClick={() => setShowQuestions((current) => !current)}
      >
        <span aria-hidden="true">🩺</span> Preguntar a mi médico
      </GameButton>
      {showQuestions && (
        <div id={questionsId} className="flex flex-col gap-2 rounded-control bg-pastel-sky px-4 py-3 text-pastel-sky-ink">
          <p className="text-lg font-bold">Lleva estas preguntas a tu consulta:</p>
          <ol className="flex list-decimal flex-col gap-1 pl-6 text-lg">
            {lesson.doctorQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-base text-muted">
        {LEARN_DISCLAIMER} Referencia general: {lesson.source}. Contenido pendiente de revisión médica.
      </p>
      <GameButton tone="vital" block haptic="success" onClick={onComplete}>
        Terminé la lección <span aria-hidden="true">✅</span>
      </GameButton>
    </BottomSheet>
  );
}
