import type { ReactNode } from "react";

interface SettingsCardProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

/** Tarjeta de una sección de Ajustes, con su encabezado accesible. */
export function SettingsCard({ id, title, description, children }: SettingsCardProps) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border-2 border-line px-5 py-5 flex flex-col gap-3"
    >
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      <p className="text-lg text-muted">{description}</p>
      {children}
    </section>
  );
}
