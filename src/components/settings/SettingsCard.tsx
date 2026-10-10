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
      className="rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 px-5 py-5 flex flex-col gap-3"
    >
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      <p className="text-base text-neutral-700 dark:text-neutral-300">{description}</p>
      {children}
    </section>
  );
}
