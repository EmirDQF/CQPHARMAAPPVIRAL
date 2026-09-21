import type { Metadata } from "next";
import { BoneSemaphoreWidget } from "@/components/dashboard/BoneSemaphoreWidget";
import { PainCheckIn } from "@/components/dashboard/PainCheckIn";
import { PainTrendChart } from "@/components/dashboard/PainTrendChart";
import { SmartPillbox } from "@/components/dashboard/SmartPillbox";
import { RestockAlert } from "@/components/dashboard/RestockAlert";
import { latestBoneScan } from "@/lib/dashboard/mockData";

export const metadata: Metadata = {
  title: "Mi Panel de Salud Ósea",
  description:
    "Semáforo Óseo, check-in diario de dolor, pastillero inteligente y reposición de tus packs CQ Pharma.",
};

export default function DashboardPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6 text-base sm:text-lg">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mi Panel de Salud Ósea</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Tu seguimiento clínico diario, en un solo lugar.
        </p>
      </div>

      <BoneSemaphoreWidget scan={latestBoneScan} />
      <PainCheckIn />
      <PainTrendChart />
      <SmartPillbox />
      <RestockAlert />
    </main>
  );
}
