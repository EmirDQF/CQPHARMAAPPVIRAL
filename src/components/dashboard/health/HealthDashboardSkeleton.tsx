/** Esqueleto de carga de "Mi salud" (sin datos inventados; sin animación con movimiento reducido). */
export function HealthDashboardSkeleton() {
  return (
    <div role="status" aria-label="Cargando Mi salud" className="flex flex-col gap-6">
      {[96, 160, 140, 180].map((height) => (
        <div key={height} className="rounded-card bg-line/60 motion-safe:animate-pulse" style={{ height }} />
      ))}
    </div>
  );
}
