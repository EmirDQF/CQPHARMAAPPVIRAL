export function buildDailyReinforcementMessage(streakDays: number): string {
  if (streakDays <= 0) {
    return "Registra tu primera toma de hoy para comenzar tu racha de adherencia.";
  }
  if (streakDays < 3) {
    return `Llevas ${streakDays} ${streakDays === 1 ? "día" : "días"} continuos. Cada toma cuenta para fijar minerales en tu hueso.`;
  }
  if (streakDays < 7) {
    return `Llevas ${streakDays} días continuos: el Citrato de Magnesio está mejorando la relajación neuromuscular nocturna.`;
  }
  if (streakDays < 14) {
    return `¡${streakDays} días de racha! Tu Colágeno con Vitamina C está optimizando la síntesis de colágeno articular.`;
  }
  if (streakDays < 30) {
    return `${streakDays} días continuos: a este ritmo, tu cuerpo está consolidando la fijación de calcio en el hueso.`;
  }
  return `¡${streakDays} días de racha! Tu adherencia sostenida es la clave para revertir la osteopenia con el tiempo.`;
}
