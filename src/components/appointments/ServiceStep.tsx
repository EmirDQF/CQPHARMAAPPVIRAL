"use client";

import { clinicalServices } from "@/lib/appointments/catalog";
import type { ClinicalServiceId } from "@/lib/appointments/types";

interface ServiceStepProps {
  onSelect: (serviceId: ClinicalServiceId) => void;
}

export function ServiceStep({ onSelect }: ServiceStepProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-brand">Paso 1 de 3</p>
        <h2 className="text-xl font-bold">¿Qué servicio necesitas?</h2>
      </div>

      <div className="flex flex-col gap-3">
        {clinicalServices.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service.id)}
            className="min-h-12 text-left rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-brand px-5 py-4 transition-colors"
          >
            <p className="font-bold text-lg">{service.name}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {service.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
