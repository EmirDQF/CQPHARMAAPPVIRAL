"use client";

import Link from "next/link";
import { useState } from "react";
import { PatientProfileModal } from "@/components/dashboard/PatientProfileModal";
import { SettingsCard } from "./SettingsCard";

/** Derecho de rectificación: el perfil se corrige aquí; cada registro, en Mis registros. */
export function RectificationSection() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <SettingsCard
      id="ajustes-rectificar"
      title="Corregir mis datos"
      description="Derecho de rectificación: corrige tu perfil médico cuando quieras. Tus registros de dolor, tomas y densitometrías se corrigen o se borran uno por uno en Mi Panel → Médico → Mis registros."
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="min-h-12 rounded-xl btn-primary font-bold px-5"
        >
          Corregir mi perfil médico
        </button>
        <Link
          href="/app"
          className="min-h-12 flex items-center justify-center rounded-xl border-2 border-brand text-clinic font-semibold px-5"
        >
          Ir a Mi Panel
        </Link>
      </div>
      {isProfileOpen && <PatientProfileModal onClose={() => setIsProfileOpen(false)} />}
    </SettingsCard>
  );
}
