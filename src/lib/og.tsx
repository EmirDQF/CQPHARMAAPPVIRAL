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
      <div style={{ fontSize: 96, display: "flex" }}>🦴</div>
      <div style={{ fontSize: 64, fontWeight: 700, color: "white", display: "flex" }}>
        Artikare
      </div>
      <div style={{ fontSize: 30, color: "#ccfbf1", display: "flex" }}>
        Tu libertad de movimiento empieza en tus huesos
      </div>
    </div>
  );
}
