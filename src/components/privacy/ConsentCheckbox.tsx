"use client";

import { PRIVACY_POLICY_PATH } from "@/lib/privacy/consent";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Casilla de consentimiento (Ley 29733): siempre inicia sin marcar y es obligatoria. */
export function ConsentCheckbox({ checked, onChange }: ConsentCheckboxProps) {
  return (
    <label className="flex items-start gap-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 px-4 py-3 cursor-pointer">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-brand"
      />
      <span className="text-sm">
        Autorizo a Artikare / CQ Pharma a tratar mis datos personales y de salud para gestionar
        mi atención, según la{" "}
        <a
          href={PRIVACY_POLICY_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand underline"
        >
          Política de Privacidad
        </a>
        .
      </span>
    </label>
  );
}
