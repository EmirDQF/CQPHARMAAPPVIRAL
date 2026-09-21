const stats = [
  { value: "+1,500", label: "evaluaciones de salud ósea realizadas" },
  { value: "100%", label: "aval reumatológico respaldado por CQ Pharma" },
  { value: "360°", label: "seguimiento clínico continuo, no solo un examen" },
];

export function SocialProofSection() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-10 grid sm:grid-cols-3 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1">
            <p className="text-3xl font-bold text-brand">{stat.value}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
