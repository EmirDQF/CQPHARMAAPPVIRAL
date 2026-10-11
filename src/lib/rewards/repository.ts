import { createPersistentStore } from "../storage/persistentStore";
import { REWARD_CATALOG } from "./catalog";
import { migrateRewardProgress } from "./rules";
import { EMPTY_REWARD_PROGRESS, rewardCatalogSchema, type RewardDefinition, type RewardProgress } from "./schemas";

/**
 * Patrón repositorio: la UI pide el catálogo a esta interfaz. Hoy el
 * adaptador es local (catalog.ts); mañana puede venir de Supabase/remoto sin
 * cambiar componentes: basta otro adaptador que devuelva datos validados.
 */
export interface RewardCatalogRepository {
  load: () => Promise<readonly RewardDefinition[]>;
}

export function createLocalRewardCatalogRepository(): RewardCatalogRepository {
  return { load: async () => REWARD_CATALOG };
}

/** Para un adaptador remoto: valida con Zod y, ante datos inválidos, vuelve al catálogo local. */
export function parseCatalogOrFallback(raw: unknown): readonly RewardDefinition[] {
  const parsed = rewardCatalogSchema.safeParse(raw);
  return parsed.success ? parsed.data : REWARD_CATALOG;
}

/**
 * Progreso local y versionado (artikare_rewards_v1). No guarda datos
 * clínicos: solo qué logro se desbloqueó y cuándo. Queda en el celular (no
 * se sincroniza en V3); entra en exportar/borrar mis datos (ARCO).
 */
export const rewardProgressStore = createPersistentStore<RewardProgress>(
  "artikare_rewards_v1",
  EMPTY_REWARD_PROGRESS,
  migrateRewardProgress
);
