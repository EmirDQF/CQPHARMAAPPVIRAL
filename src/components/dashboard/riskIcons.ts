import { CircleCheck, OctagonAlert, Stethoscope, TriangleAlert, type LucideIcon } from "lucide-react";
import type { RiskLevel } from "@/lib/types";

/** Icono por nivel OMS: la forma refuerza el color, para quien no distingue rojo y verde. */
export const RISK_ICON: Record<RiskLevel, LucideIcon> = {
  bajo: CircleCheck,
  moderado: TriangleAlert,
  alto: OctagonAlert,
};

/** Sin T-score aplicable (p. ej. Z-score) no hay semáforo: derivación médica. */
export const NO_T_SCORE_ICON: LucideIcon = Stethoscope;
