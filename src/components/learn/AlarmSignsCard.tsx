import { ALARM_SIGNS } from "@/lib/learn/glossary";

/** "Señales de alarma": cuándo consultar al reumatólogo. Informativo, sin diagnóstico. */
export function AlarmSignsCard() {
  return (
    <section aria-labelledby="senales-alarma" className="flex flex-col gap-3 rounded-card border-2 border-pastel-peach-edge bg-pastel-peach p-4 text-pastel-peach-ink">
      <h2 id="senales-alarma" className="text-2xl font-black">
        Señales para consultar
      </h2>
      <p className="text-lg">Si notas alguna de estas señales, pide una cita con tu médico o reumatólogo.</p>
      <ul className="flex flex-col gap-2">
        {ALARM_SIGNS.map((sign) => (
          <li key={sign.id} className="flex gap-3 rounded-control bg-surface px-3 py-3 text-foreground">
            <span aria-hidden="true" className="text-2xl">
              {sign.emoji}
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-bold">{sign.title}</span>
              <span className="text-lg text-muted">{sign.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
