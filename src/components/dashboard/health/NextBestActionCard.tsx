import { GameButton } from "@/components/ui/GameButton";
import type { NextBestAction } from "@/lib/dashboard/healthSummary";

interface NextBestActionCardProps {
  action: NextBestAction;
  onAct: () => void;
}

/** Una sola sugerencia, la más útil ahora. Con bandera roja es la evaluación médica. */
export function NextBestActionCard({ action, onAct }: NextBestActionCardProps) {
  const isUrgent = action.id === "evaluacion";
  return (
    <section
      aria-labelledby="siguiente-accion"
      className={`flex flex-col gap-3 rounded-card border-2 p-4 shadow-soft ${
        isUrgent ? "border-risk-high bg-pastel-rose text-pastel-rose-ink" : "border-pastel-mint-edge bg-pastel-mint text-pastel-mint-ink"
      }`}
    >
      <p className="text-lg font-bold uppercase tracking-wide">Tu siguiente paso</p>
      <h2 id="siguiente-accion" className="flex items-center gap-2 text-2xl font-black">
        <span aria-hidden="true">{action.emoji}</span> {action.title}
      </h2>
      <p className="text-lg">{action.detail}</p>
      <GameButton tone={isUrgent ? "pink" : "vital"} block onClick={onAct}>
        {action.cta}
      </GameButton>
    </section>
  );
}
