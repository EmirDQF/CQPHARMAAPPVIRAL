import type { Metadata } from "next";
import { AccessScreen } from "@/components/auth/AccessScreen";

export const metadata: Metadata = {
  title: "Accede a tu cuenta",
  description: "Ingresa con tu correo y un código de 6 dígitos para respaldar tus registros.",
  robots: { index: false, follow: false },
};

export default function AccesoPage() {
  return <AccessScreen />;
}
