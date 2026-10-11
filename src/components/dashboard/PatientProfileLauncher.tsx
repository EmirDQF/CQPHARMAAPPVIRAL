"use client";

import { UserRound } from "lucide-react";
import { useState } from "react";
import { PatientProfileModal } from "./PatientProfileModal";

export function PatientProfileLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Editar mi perfil médico"
        className="min-h-12 min-w-12 flex items-center justify-center rounded-full bg-pastel-lavender text-pastel-lavender-ink transition-transform active:scale-95"
      >
        <UserRound aria-hidden="true" className="size-5 shrink-0" />
      </button>
      {/* Montaje condicional: al abrir, el formulario lee el perfil guardado (no el del SSR). */}
      {isOpen && <PatientProfileModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
