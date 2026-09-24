export interface SocialProofStat {
  value: string;
  label: string;
}

/**
 * Cifras verificadas por CQ Pharma. Vacío hasta recibir datos reales:
 * nunca se publican números de evaluaciones ni avales sin respaldo.
 */
export const VERIFIED_SOCIAL_PROOF_STATS: readonly SocialProofStat[] = [];

// Describe el servicio (no es una cifra), por eso no requiere verificación.
const SERVICE_DESCRIPTION: SocialProofStat = {
  value: "360°",
  label: "seguimiento clínico continuo, no solo un examen",
};

export function buildSocialProofItems(
  verifiedStats: readonly SocialProofStat[]
): SocialProofStat[] {
  return [...verifiedStats, SERVICE_DESCRIPTION];
}
