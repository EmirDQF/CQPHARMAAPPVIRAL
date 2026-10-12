import type { ReactElement } from "react";
import { THEMES } from "./design/tokens";

const LIGHT = THEMES.light;

export function ArtikareOgImage(): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        background: LIGHT["color-canvas"],
        color: LIGHT["color-ink"],
      }}
    >
      {/* SVG propio: un emoji hace que next/og descargue un recurso de un CDN en el build. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 200,
          height: 200,
          borderRadius: 100,
          background: LIGHT["color-pastel-mint"],
          border: `6px solid ${LIGHT["color-pastel-mint-edge"]}`,
        }}
      >
        <svg width="130" height="130" viewBox="0 0 100 100" aria-hidden="true">
          <g fill={LIGHT["color-pastel-mint-ink"]} transform="rotate(-45 50 50)">
            <rect x="22" y="43" width="56" height="14" rx="4" />
            <circle cx="20" cy="40" r="10" />
            <circle cx="20" cy="60" r="10" />
            <circle cx="80" cy="40" r="10" />
            <circle cx="80" cy="60" r="10" />
          </g>
        </svg>
      </div>
      <div style={{ fontSize: 64, fontWeight: 700, color: LIGHT["color-clinic"], display: "flex" }}>Artikare</div>
      <div style={{ fontSize: 30, color: LIGHT["color-ink"], display: "flex" }}>
        Tu libertad de movimiento empieza en tus huesos
      </div>
    </div>
  );
}
