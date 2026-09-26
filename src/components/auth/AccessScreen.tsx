"use client";

import Link from "next/link";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { getEmailOtpChannel } from "@/lib/supabase/browserAuth";
import { AccessPanel } from "./AccessPanel";

/** Pantalla /acceso: para quien ya tiene cuenta y cambió de celular, o quiere crearla. */
export function AccessScreen() {
  const authStatus = useAuthStatus();

  return (
    <main className="w-full max-w-md mx-auto px-4 py-10 flex flex-col gap-6 min-h-dvh">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Accede a tu cuenta</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Usa tu correo y un código de 6 dígitos. Sin contraseñas. No necesitas cuenta para usar la app.
        </p>
      </div>

      {authStatus === "account" ? (
        <p role="status" className="rounded-xl bg-risk-low-bg text-risk-low px-4 py-3 font-semibold">
          Ya ingresaste con tu cuenta en este celular.
        </p>
      ) : (
        <AccessPanel channel={getEmailOtpChannel()} />
      )}

      <Link href="/app" className="font-semibold text-brand">
        ← Volver a mi panel
      </Link>
    </main>
  );
}
