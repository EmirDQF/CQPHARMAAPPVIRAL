import type { Metadata } from "next";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

export const metadata: Metadata = {
  title: "Ajustes y privacidad",
  description: "Descarga, corrige o borra tus datos de Artikare y retira tus autorizaciones (Ley N.º 29733).",
  robots: { index: false },
};

export default function AjustesPage() {
  return <SettingsScreen />;
}
