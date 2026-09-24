export function buildDailyReinforcementMessage(streakDays: number): string {
  if (streakDays <= 0) {
    return "Registra tu primera toma de hoy para comenzar tu racha de adherencia.";
  }
  if (streakDays < 3) {
    return `Llevas ${streakDays} ${streakDays === 1 ? "día" : "días"} continuos. La constancia es lo que más apoya tu plan de cuidado.`;
  }
  if (streakDays < 7) {
    return `Llevas ${streakDays} días continuos: el Citrato de Magnesio contribuye al funcionamiento normal de músculos y huesos.`;
  }
  if (streakDays < 14) {
    return `¡${streakDays} días de racha! La Vitamina C contribuye a la formación normal de colágeno.`;
  }
  if (streakDays < 30) {
    return `${streakDays} días continuos: la Vitamina D3 contribuye a la absorción normal del calcio.`;
  }
  return `¡${streakDays} días de racha! Tu suplementación complementa el tratamiento indicado por tu médico: comparte tu progreso en tu próximo control.`;
}
