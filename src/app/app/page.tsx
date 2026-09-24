import type { Metadata } from "next";
import { AppShell } from "@/components/dashboard/AppShell";

export const metadata: Metadata = {
  title: "Mi Panel de Salud Ósea",
  description:
    "Semáforo Óseo, citas médicas, check-in diario de dolor, pastillero inteligente y reposición de tus packs CQ Pharma.",
};

export default function DashboardPage() {
  return <AppShell />;
}
