import { PASTELS, THEMES } from "../design/tokens";
import { feedbackPreferencesStore, type FeedbackPreferences } from "./preferences";

/**
 * Confeti al completar la meta del día. canvas-confetti se descarga solo en
 * ese momento (import dinámico, nunca en la landing) y no se lanza si la
 * persona apagó las celebraciones o pidió menos movimiento.
 */
const CONFETTI_PARTICLES = 120;
const CONFETTI_SPREAD = 75;
const CONFETTI_ORIGIN_Y = 0.6;
/** Bordes pastel (visibles sobre el lienzo claro y oscuro); canvas-confetti necesita valores, no variables CSS. */
const CONFETTI_COLORS = PASTELS.map((name) => THEMES.light[`color-pastel-${name}-edge`]);

export interface CelebrateDependencies {
  readPreferences: () => FeedbackPreferences;
  prefersReducedMotion: () => boolean;
  fire: (options: { particleCount: number; spread: number; origin: { y: number }; colors: string[]; disableForReducedMotion: boolean }) => Promise<void>;
}

async function fireConfetti(options: Parameters<CelebrateDependencies["fire"]>[0]): Promise<void> {
  const { default: confetti } = await import("canvas-confetti");
  await confetti(options);
}

function defaultDependencies(): CelebrateDependencies {
  return {
    readPreferences: feedbackPreferencesStore.getSnapshot,
    prefersReducedMotion: () =>
      typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    fire: fireConfetti,
  };
}

/** true si se lanzó el confeti. */
export async function celebrateGoal(deps: CelebrateDependencies = defaultDependencies()): Promise<boolean> {
  if (!deps.readPreferences().celebrations || deps.prefersReducedMotion()) return false;
  try {
    await deps.fire({
      particleCount: CONFETTI_PARTICLES,
      spread: CONFETTI_SPREAD,
      origin: { y: CONFETTI_ORIGIN_Y },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
    return true;
  } catch {
    // Sin canvas (equipo antiguo): la celebración de Artiko en pantalla basta.
    return false;
  }
}
