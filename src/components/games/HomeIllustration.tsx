/**
 * Ilustración propia (SVG) de una casa con sala, escalera y baño para el
 * juego "Casa segura". Colores de tokens pastel; decorativa: los puntos
 * tocables son botones aparte con su propio texto accesible.
 */
export function HomeIllustration() {
  return (
    <svg viewBox="0 0 100 75" aria-hidden="true" className="block h-auto w-full">
      {/* Paredes y piso */}
      <rect x="0" y="0" width="72" height="56" className="fill-pastel-lemon" />
      <rect x="72" y="0" width="28" height="56" className="fill-pastel-sky" />
      <rect x="0" y="56" width="100" height="19" className="fill-pastel-peach" />
      <line x1="72" y1="0" x2="72" y2="75" strokeWidth="0.8" className="stroke-line" />
      {/* Pasillo oscuro con lámpara apagada */}
      <rect x="2" y="8" width="18" height="30" rx="1" className="fill-clinic" opacity="0.55" />
      <circle cx="11" cy="14" r="2.4" className="fill-surface" opacity="0.5" />
      {/* Escalera sin pasamanos */}
      {[0, 1, 2, 3].map((step) => (
        <rect key={step} x={10 + step * 4} y={40 + step * 4} width={16 - step * 4} height="4" className="fill-pastel-lavender-edge" opacity="0.7" />
      ))}
      {/* Estante alto con cajas */}
      <rect x="36" y="10" width="20" height="1.6" className="fill-pastel-peach-edge" />
      <rect x="38" y="5" width="5" height="5" className="fill-pastel-rose-edge" />
      <rect x="45" y="6" width="6" height="4" className="fill-pastel-mint-edge" />
      {/* Luz de noche en el enchufe */}
      <rect x="36" y="35" width="4" height="5" rx="1" className="fill-surface" />
      <circle cx="38" cy="37.5" r="1.4" className="fill-gold" />
      {/* Silla con brazos */}
      <rect x="55" y="38" width="10" height="12" rx="1.5" className="fill-pastel-mint-edge" />
      <rect x="53" y="44" width="14" height="3" rx="1" className="fill-pastel-mint-edge" />
      {/* Alfombra con el borde levantado */}
      <ellipse cx="30" cy="64" rx="13" ry="3.5" className="fill-pastel-rose" />
      <path d="M40 62 q4 -4 4 1" strokeWidth="1.2" fill="none" className="stroke-pastel-rose-edge" />
      {/* Cable cruzando el paso */}
      <path d="M44 70 q4 -3 8 0 t8 0" strokeWidth="0.9" fill="none" className="stroke-clinic" />
      {/* Chinelas sueltas */}
      <ellipse cx="62" cy="61" rx="2.5" ry="1.2" className="fill-pastel-lavender-edge" />
      <ellipse cx="66" cy="62" rx="2.5" ry="1.2" className="fill-pastel-lavender-edge" />
      {/* Baño: ducha, barra de apoyo y charco */}
      <rect x="78" y="8" width="18" height="42" rx="1" className="fill-surface" opacity="0.7" />
      <rect x="84" y="34" width="10" height="1.6" rx="0.8" className="fill-pastel-sky-edge" />
      <ellipse cx="82" cy="66" rx="9" ry="3" className="fill-pastel-sky-edge" opacity="0.6" />
    </svg>
  );
}
