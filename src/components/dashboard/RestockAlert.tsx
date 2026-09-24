"use client";

import { useSyncExternalStore } from "react";
import { RESTOCK_DISCOUNT_PERCENT } from "@/lib/clinical/constants";
import { buildBottleStatuses } from "@/lib/dashboard/bottleTracking";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import type { DosePeriod } from "@/lib/dashboard/types";
import { productPacks } from "@/lib/products";
import { buildProductPackWhatsAppLink } from "@/lib/whatsapp";

const RESTOCK_PACK_ID_BY_PERIOD: Record<DosePeriod, string> = {
  morning: "movilidad-total",
  night: "hueso-fuerte-360",
};

/** Solo aparece cuando el consumo real alcanza el día de reposición (80% del frasco). */
export function RestockAlert() {
  const state = useSyncExternalStore(
    pillboxStore.subscribe,
    pillboxStore.getSnapshot,
    pillboxStore.getServerSnapshot
  );
  const bottlesToRestock = buildBottleStatuses(state).filter((bottle) => bottle.needsRestock);

  return (
    <>
      {bottlesToRestock.map((bottle) => {
        const pack = productPacks.find(
          (candidate) => candidate.id === RESTOCK_PACK_ID_BY_PERIOD[bottle.period]
        );
        if (!pack) return null;

        return (
          <section
            key={bottle.period}
            className="rounded-2xl border-2 border-risk-moderate/50 bg-risk-moderate-bg px-6 py-6 flex flex-col gap-4"
          >
            <p className="font-semibold text-risk-moderate">
              🔔 Tu frasco de {bottle.label} está al {bottle.percentRemaining}% (
              {bottle.servingsRemaining} tomas)
            </p>

            <div className="h-3 w-full rounded-full bg-white/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-risk-moderate"
                style={{ width: `${bottle.percentRemaining}%` }}
              />
            </div>

            <p className="text-sm text-neutral-700">
              Pide tu reposición de {pack.name} con {RESTOCK_DISCOUNT_PERCENT}% de descuento
              antes de interrumpir tu racha.
            </p>

            <a
              href={buildProductPackWhatsAppLink(pack)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-12 flex items-center justify-center rounded-xl bg-risk-moderate text-white font-semibold px-4 transition-colors hover:opacity-90"
            >
              Reponer Mi Pack con Descuento
            </a>
          </section>
        );
      })}
    </>
  );
}
