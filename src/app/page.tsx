import { ArticularTest } from "@/components/ArticularTest/ArticularTest";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 py-16 gap-12">
      <div className="max-w-2xl text-center flex flex-col gap-4">
        <p className="text-brand font-semibold uppercase tracking-wide text-sm">
          Artikare · Respaldado por CQ Pharma
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-balance">
          Descubre la salud real de tus articulaciones y huesos antes de que
          el dolor limite tu vida.
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 text-balance">
          Evaluación médica interactiva en 2 minutos, densitometría ósea
          precisa y nutrición celular clínica.
        </p>
      </div>

      <ArticularTest />
    </main>
  );
}
