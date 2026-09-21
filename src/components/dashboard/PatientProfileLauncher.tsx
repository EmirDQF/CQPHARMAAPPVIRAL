"use client";

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
        className="min-h-12 min-w-12 flex items-center justify-center rounded-full text-xl bg-neutral-100 dark:bg-neutral-800"
      >
        👤
      </button>
      <PatientProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
