interface EcosystemStep {
  number: number;
  title: string;
  description: string;
}

const steps: EcosystemStep[] = [
  {
    number: 1,
    title: "Diagnóstico Computarizado",
    description: "Densitometría ósea en consultorio con lectura médica de T-Score.",
  },
  {
    number: 2,
    title: "Semáforo Óseo Digital",
    description: "Tu resultado traducido a un indicador visual claro: verde, amarillo o rojo.",
  },
  {
    number: 3,
    title: "Nutrición Celular CQ Pharma",
    description: "Suplementación dirigida según tu diagnóstico: magnesio, D3, colágeno y zinc.",
  },
];

export function EcosystemSection() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-16 flex flex-col gap-10">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Nuestro Ecosistema Integral</h2>
        <p className="text-neutral-600 dark:text-neutral-300">
          De un examen aislado a un plan de cuidado continuo.
        </p>
      </div>

      <ol className="flex flex-col sm:flex-row gap-6 sm:gap-4">
        {steps.map((step, index) => (
          <li key={step.number} className="flex-1 flex sm:flex-col items-start sm:items-center gap-4 sm:text-center">
            <div className="flex sm:flex-col items-center gap-4 sm:gap-3 shrink-0">
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-brand text-white font-bold text-lg shrink-0">
                {step.number}
              </span>
              {index < steps.length - 1 && (
                <span className="hidden sm:block w-full h-0.5 bg-brand-light" aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
