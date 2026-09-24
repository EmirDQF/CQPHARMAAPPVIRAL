import { BoneComparisonVisual } from "./BoneComparisonVisual";

export function PainEvidenceSection() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16 flex flex-col gap-8">
      <div className="text-center flex flex-col gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-balance">
          ¿Sabías que la osteoporosis no avisa con dolor, sino con fracturas?
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto text-balance">
          La pérdida de masa ósea es silenciosa: puede avanzar durante años sin
          síntomas evidentes, hasta que una caída menor termina en una
          fractura. Por eso la evaluación preventiva es la única forma real de
          adelantarte.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-6">
        <BoneComparisonVisual />
      </div>

      <div className="rounded-2xl border-2 border-risk-moderate/40 bg-risk-moderate-bg px-6 py-5 flex flex-col gap-2">
        <p className="font-semibold text-risk-moderate">
          La trampa del colágeno común
        </p>
        <p className="text-sm text-neutral-700 dark:text-neutral-800">
          La Vitamina C contribuye a la formación normal de colágeno y el
          Magnesio contribuye al mantenimiento normal de los huesos. Por eso
          nuestros packs combinan estos nutrientes, siempre como complemento
          de las indicaciones de tu médico.
        </p>
      </div>
    </section>
  );
}
