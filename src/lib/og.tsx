import type { ReactElement } from "react";

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
        background: "linear-gradient(135deg, #0f766e 0%, #115e59 100%)",
      }}
    >
      {/* SVG propio: un emoji hace que next/og descargue un recurso de un CDN en el build. */}
      <svg width="140" height="140" viewBox="0 0 100 100" aria-hidden="true">
        <g fill="white" transform="rotate(-45 50 50)">
          <rect x="22" y="43" width="56" height="14" rx="4" />
          <circle cx="20" cy="40" r="10" />
          <circle cx="20" cy="60" r="10" />
          <circle cx="80" cy="40" r="10" />
          <circle cx="80" cy="60" r="10" />
        </g>
      </svg>
      <div style={{ fontSize: 64, fontWeight: 700, color: "white", display: "flex" }}>
        Artikare
      </div>
      <div style={{ fontSize: 30, color: "#ccfbf1", display: "flex" }}>
        Tu libertad de movimiento empieza en tus huesos
      </div>
    </div>
  );
}
