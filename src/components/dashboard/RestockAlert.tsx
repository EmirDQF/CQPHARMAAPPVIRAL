"use client";

import { useSyncExternalStore } from "react";
import { RESTOCK_DISCOUNT_PERCENT } from "@/lib/clinical/constants";
import { buildBottleStatuses } from "@/lib/dashboard/bottleTracking";
import { bottlesStore, startNewBottle } from "@/lib/dashboard/bottles";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import type { DosePeriod } from "@/lib/dashboard/types";
import { productPacks } from "@/lib/products";
import { buildProductPackWhatsAppLink } from "@/lib/whatsapp";
import { useActiveRedFlags } from "./useActiveRedFlags";

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
  const bottles = useSyncExternalStore(
    bottlesStore.subscribe,
    bottlesStore.getSnapshot,
    bottlesStore.getServerSnapshot
  );
  const hasRedFlag = useActiveRedFlags().length > 0;
  const bottlesToRestock = buildBottleStatuses(state, bottles).filter(
    (bottle) => bottle.needsRestock
  );

  // Con bandera roja no se ofrece reposición con descuento: primero el reumatólogo.
  if (hasRedFlag) return null;

  return (
    <>
      {bottlesToRestock.map((bottle) => {
        const pack = productPacks.find(
          (candidate) => candidate.id === RESTOCK_PACK_ID_BY_PERIOD[bottle.period]
        );
        if (!pack) return null;
        const whatsAppLink = buildProductPackWhatsAppLink(pack);

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

            <p className="text-base text-neutral-700">
              Si te quedan pocas tomas, puedes pedir tu reposición de {pack.name} con{" "}
              {RESTOCK_DISCOUNT_PERCENT}% de descuento.
            </p>

            {whatsAppLink ? (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-12 flex items-center justify-center rounded-xl bg-risk-moderate text-white font-semibold px-4 transition-colors hover:opacity-90"
              >
                Reponer Mi Pack con Descuento
              </a>
            ) : (
              <p className="text-base text-neutral-700">WhatsApp no disponible por el momento.</p>
            )}

            <button
              type="button"
              onClick={() => startNewBottle(bottle.productId)}
              className="min-h-12 rounded-xl border-2 border-risk-moderate text-risk-moderate font-semibold px-4 transition-colors hover:bg-white/60"
            >
              Ya repuse mi frasco
            </button>
          </section>
        );
      })}
    </>
  );
}
