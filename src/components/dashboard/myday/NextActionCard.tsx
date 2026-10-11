import Link from "next/link";
import { DOSE_SCHEDULE } from "@/lib/clinical/constants";
import type { NextAction } from "@/lib/dashboard/myDay";
import { formatTime24hForDisplay } from "@/lib/utils/date";

interface NextActionCardProps {
  /** null hasta conocer la hora del celular: tarjeta del mismo alto, sin sugerencia. */
  action: NextAction | null;
  onOpenBoneTab: () => void;
}

const LINK_CLASS =
  "min-h-12 inline-flex items-center justify-center rounded-control bg-action-strong text-on-action-strong font-semibold px-5 transition-transform duration-150 active:scale-[0.98]";

function doseLabel(doseId: string): string {
  return DOSE_SCHEDULE.find((dose) => dose.id === doseId)?.label ?? "tu toma";
}

function ActionBody({ action, onOpenBoneTab }: NextActionCardProps) {
  // Siempre un fragmento con el <p> primero: React reutiliza ese nodo al hidratar
  // y el texto del servidor ya cuenta como pintura temprana (LCP).
  if (!action) {
    return (
      <>
        <p className="font-semibold">Estamos preparando tu día: en un momento verás tu siguiente paso.</p>
      </>
    );
  }
  switch (action.kind) {
    case "red-flag":
      return (
        <>
          <p className="font-semibold">Primero, agenda tu evaluación reumatológica.</p>
          <Link href="/citas" className="min-h-12 inline-flex items-center justify-center rounded-control bg-risk-high text-white text-center font-semibold px-5 py-2">
            Agendar evaluación
          </Link>
        </>
      );
    case "take-dose":
      return (
        <>
          <p className="font-semibold">
            Te toca: {doseLabel(action.doseId)} ({formatTime24hForDisplay(action.time)}).
          </p>
          <a href="#pastillero" className={LINK_CLASS}>Ir al pastillero</a>
        </>
      );
    case "check-in":
      return (
        <>
          <p className="font-semibold">Cuéntanos cómo amanecieron tus articulaciones: toma 10 segundos.</p>
          <a href="#chequeo" className={LINK_CLASS}>Hacer mi chequeo</a>
        </>
      );
    case "upcoming-dose":
      return (
        <>
          <p className="font-semibold">Tu próxima toma es a las {formatTime24hForDisplay(action.time)} — te esperamos.</p>
        </>
      );
    case "register-dexa":
      return (
        <>
          <p className="font-semibold">Todo listo por hoy. Si tienes tu densitometría, regístrala para ver tu Semáforo Óseo.</p>
          <button type="button" onClick={onOpenBoneTab} className={LINK_CLASS}>Registrar densitometría</button>
        </>
      );
    case "all-done":
      return (
        <>
          <p className="font-semibold">Todo listo por hoy. Gracias por dedicarte este momento.</p>
        </>
      );
  }
}

/** Una sola sugerencia: la más útil ahora (ver suggestNextAction). */
export function NextActionCard(props: NextActionCardProps) {
  return (
    <section aria-labelledby="siguiente-accion" className="min-h-44 rounded-card bg-pastel-sky text-pastel-sky-ink px-5 py-4 flex flex-col gap-3">
      <h2 id="siguiente-accion" className="text-sm font-bold uppercase tracking-wide">Lo siguiente</h2>
      <ActionBody {...props} />
    </section>
  );
}
