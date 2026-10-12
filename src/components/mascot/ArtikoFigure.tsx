import type { CSSProperties } from "react";
import { GAME_TONE_PASTEL, THEMES } from "@/lib/design/tokens";
import {
  ARTIKO_POSES,
  artikoLabel,
  type ArtikoAccessory,
  type ArtikoEmotion,
} from "@/lib/mascot/mascot";
import { Accessories, Arms, BackEffects, CapsuleBody, Eyes, FrontEffects, LegsAndSneakers, Mouth } from "./artikoParts";

export interface ArtikoFigureProps {
  emotion?: ArtikoEmotion;
  accessories?: readonly ArtikoAccessory[];
  /** Alto en px; el ancho sigue la proporción 120:140. Se reconoce desde 32 px. */
  size?: number;
  /** true = acompaña un texto que ya dice lo mismo: se oculta a lectores de pantalla. */
  decorative?: boolean;
  /** Nombre accesible propio (por defecto, la descripción de la emoción). */
  label?: string;
  className?: string;
}

/**
 * Artiko conserva sus colores en modo oscuro: su dibujo usa siempre la
 * paleta pastel clara (los alias de la capa viva cambian con el tema).
 */
const LIGHT = THEMES.light;
const ARTIKO_PALETTE = Object.fromEntries(
  Object.entries(GAME_TONE_PASTEL).flatMap(([tone, pastel]) => [
    [`--color-${tone}`, LIGHT[`color-pastel-${pastel}`]],
    [`--color-${tone}-deep`, LIGHT[`color-pastel-${pastel}-edge`]],
  ])
) as CSSProperties;

const VIEWBOX_WIDTH = 120;
const VIEWBOX_HEIGHT = 140;
const DEFAULT_SIZE = 160;

/**
 * Artiko en SVG puro, sin JavaScript de animación: sirve en el servidor y en
 * la landing. Flotación, parpadeo y llamas son CSS (`artiko-*`, motion-safe).
 * El salto o el ladeo por emoción los agrega ArtikoMascot en /app.
 */
export function ArtikoFigure({
  emotion = "happy",
  accessories = [],
  size = DEFAULT_SIZE,
  decorative = false,
  label,
  className,
}: ArtikoFigureProps) {
  const pose = ARTIKO_POSES[emotion];
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": label ?? artikoLabel(emotion, accessories) } as const);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      height={size}
      width={(size * VIEWBOX_WIDTH) / VIEWBOX_HEIGHT}
      data-emotion={emotion}
      className={className}
      style={ARTIKO_PALETTE}
      focusable="false"
      {...a11y}
    >
      {/* El ladeo va en un grupo aparte: la animación CSS de flotación reemplazaría su transform. */}
      <g transform={pose.tilt ? `rotate(${pose.tilt} 60 120)` : undefined}>
        <g className="artiko-float">
          <BackEffects effects={pose.effects} />
          <LegsAndSneakers />
          <CapsuleBody />
          <Arms pose={pose.arms} />
          <Eyes style={pose.eyes} />
          <g transform="translate(0 -2)">
            <Mouth style={pose.mouth} />
          </g>
          <Accessories items={accessories} />
          <FrontEffects effects={pose.effects} />
        </g>
      </g>
    </svg>
  );
}
