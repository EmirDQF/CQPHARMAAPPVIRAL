import type { Metadata } from "next";
import { ReporteMedicoView } from "@/components/dashboard/ReporteMedicoView";
import { latestBoneScan } from "@/lib/dashboard/mockData";

export const metadata: Metadata = {
  title: "Reporte Médico Imprimible",
  description:
    "Ficha clínica imprimible con T-Score, evolución del dolor y adherencia a tu tratamiento CQ Pharma.",
};

export default function ReporteMedicoPage() {
  return <ReporteMedicoView fallbackScan={latestBoneScan} />;
}
