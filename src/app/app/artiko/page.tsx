import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtikoMascot } from "@/components/mascot/ArtikoMascot";
import { ARTIKO_ACCESSORIES, ARTIKO_EMOTIONS, MASCOT } from "@/lib/mascot/mascot";

export const metadata: Metadata = {
  title: `Galería de ${MASCOT.name}`,
  robots: { index: false, follow: false },
};

const PREVIEW_SIZES = [32, 64, 160] as const;

/**
 * Galería de pruebas visuales de Artiko: todos los estados, tamaños y
 * accesorios. Solo en desarrollo; en producción responde 404.
 */
export default function ArtikoGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="text-4xl font-black text-clinic">Galería de {MASCOT.name}</h1>
      <section aria-labelledby="estados" className="flex flex-col gap-4">
        <h2 id="estados" className="text-2xl font-black">Estados</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ARTIKO_EMOTIONS.map((emotion) => (
            <li key={emotion} className="flex flex-col items-center gap-2 rounded-card bg-surface p-4 shadow-soft">
              <ArtikoMascot emotion={emotion} size={140} />
              <code className="text-base font-bold">{emotion}</code>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="tamanos" className="flex flex-col gap-4">
        <h2 id="tamanos" className="text-2xl font-black">Tamaños (silueta a 32 px)</h2>
        <div className="flex items-end gap-6 rounded-card bg-surface p-4 shadow-soft">
          {PREVIEW_SIZES.map((size) => (
            <ArtikoMascot key={size} emotion="happy" size={size} />
          ))}
        </div>
      </section>
      <section aria-labelledby="accesorios" className="flex flex-col gap-4">
        <h2 id="accesorios" className="text-2xl font-black">Accesorios cosméticos</h2>
        <div className="flex flex-wrap items-end gap-6 rounded-card bg-surface p-4 shadow-soft">
          {ARTIKO_ACCESSORIES.map((accessory) => (
            <ArtikoMascot key={accessory} emotion="happy" accessories={[accessory]} size={140} />
          ))}
          <ArtikoMascot emotion="fire_streak" accessories={ARTIKO_ACCESSORIES} size={140} />
        </div>
      </section>
    </main>
  );
}
