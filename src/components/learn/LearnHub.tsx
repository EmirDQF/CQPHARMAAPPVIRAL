"use client";

import { Check } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useActiveRedFlags } from "@/components/dashboard/useActiveRedFlags";
import { LearningRewardModal } from "@/components/rewards/LearningRewardModal";
import { useLearningReward } from "@/hooks/useLearningReward";
import { learnedKeys, learningKey } from "@/lib/gamification/learning";
import { gameProgressStore } from "@/lib/gamification/progress";
import { visibleLessons } from "@/lib/learn/lessons";
import { LEARN_DISCLAIMER, type Lesson } from "@/lib/learn/schemas";
import { toLimaIsoDate } from "@/lib/utils/date";
import { AlarmSignsCard } from "./AlarmSignsCard";
import { GlossarySearch } from "./GlossarySearch";
import { LessonSheet } from "./LessonSheet";

const SECTIONS = [
  { id: "lecciones", label: "Lecciones" },
  { id: "alarmas", label: "Señales" },
  { id: "glosario", label: "Glosario" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-lg font-bold">
        {done} de {total} lecciones leídas
      </p>
      <div role="progressbar" aria-label="Lecciones leídas" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="h-4 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-vital-deep transition-[width] duration-700 ease-out" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LessonCard({ lesson, doneToday, onOpen }: { lesson: Lesson; doneToday: boolean; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="press-scale flex min-h-20 w-full items-center gap-3 rounded-card border-2 border-line bg-surface p-4 text-left shadow-soft"
      >
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pastel-lavender text-2xl">
          {lesson.emoji}
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-lg font-black text-clinic">{lesson.title}</span>
          <span className="text-lg text-muted">
            {lesson.minutes} min · {lesson.summary}
          </span>
        </span>
        {doneToday && (
          <span className="flex items-center gap-1 rounded-full bg-pastel-mint px-2 py-1 text-lg font-bold text-pastel-mint-ink">
            <Check aria-hidden="true" className="size-4" /> Hoy
          </span>
        )}
      </button>
    </li>
  );
}

/** "Aprender": lecciones de reumatología, señales para consultar y glosario. */
export function LearnHub() {
  const [section, setSection] = useState<SectionId>("lecciones");
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const hasRedFlag = useActiveRedFlags().length > 0;
  const progress = useSyncExternalStore(gameProgressStore.subscribe, gameProgressStore.getSnapshot, gameProgressStore.getServerSnapshot);
  const { reward, complete, dismiss } = useLearningReward();
  const lessons = visibleLessons(hasRedFlag);
  const everLearned = learnedKeys(progress.learning);
  const today = new Set(progress.learning[toLimaIsoDate()] ?? []);
  const readCount = lessons.filter((lesson) => everLearned.has(learningKey("lesson", lesson.id))).length;

  function finishLesson(lesson: Lesson) {
    setOpenLesson(null);
    complete("lesson", lesson.id, `“${lesson.title}”`);
  }

  return (
    <section aria-labelledby="aprender-titulo" className="flex flex-col gap-5">
      <h1 id="aprender-titulo" className="text-3xl font-black text-clinic">
        Aprender <span aria-hidden="true">📚</span>
      </h1>
      <p className="text-lg text-muted">{LEARN_DISCLAIMER}</p>

      <div role="group" aria-label="Secciones de Aprender" className="grid grid-cols-3 gap-2">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={section === item.id}
            onClick={() => setSection(item.id)}
            className="min-h-12 rounded-control border-2 border-line bg-surface px-2 text-lg font-bold aria-pressed:border-vital-deep aria-pressed:bg-vital aria-pressed:text-vital-ink"
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "lecciones" && (
        <>
          <ProgressBar done={readCount} total={lessons.length} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                doneToday={today.has(learningKey("lesson", lesson.id))}
                onOpen={() => setOpenLesson(lesson)}
              />
            ))}
          </ul>
        </>
      )}
      {section === "alarmas" && <AlarmSignsCard />}
      {section === "glosario" && <GlossarySearch />}

      {openLesson && <LessonSheet lesson={openLesson} onComplete={() => finishLesson(openLesson)} onClose={() => setOpenLesson(null)} />}
      {reward && <LearningRewardModal reward={reward} onClose={dismiss} />}
    </section>
  );
}
