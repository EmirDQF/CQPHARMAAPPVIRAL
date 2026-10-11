/** Esqueleto mientras se lee el celular: evita mostrar "0 días" o tareas vacías por un instante. */
export function MyDaySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4 motion-safe:animate-pulse">
      <div className="h-16 rounded-card bg-pastel-sky" />
      <div className="h-36 rounded-card bg-pastel-mint" />
      <div className="h-56 rounded-card bg-surface border border-line" />
    </div>
  );
}
