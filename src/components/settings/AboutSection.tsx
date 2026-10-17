import { formatAppVersionLabel } from "@/lib/version/appVersion";
import { SettingsCard } from "./SettingsCard";

/** Versión de la app, horneada en el build desde package.json (next.config.ts): sin llamadas de red. */
export function AboutSection() {
  const label = formatAppVersionLabel(process.env.NEXT_PUBLIC_APP_VERSION, process.env.NEXT_PUBLIC_APP_BUILD);
  return (
    <SettingsCard
      id="about-heading"
      title="Acerca de"
      description="La versión de Artikare instalada en tu celular. Te la pueden pedir si reportas un problema."
    >
      <p className="text-lg font-semibold">{label}</p>
    </SettingsCard>
  );
}
