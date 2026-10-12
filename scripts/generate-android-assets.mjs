#!/usr/bin/env node
// npm run generate:android-assets — el logo de la app es Artiko, la mascota.
// 1) Exporta su SVG con el mismo componente de la app (vitest.assets.config.mts).
// 2) Lo dibuja con el Chromium de Playwright sobre la paleta pastel de docs/DESIGN.md
//    (menta, crema) y guarda: icono adaptativo con monocromo, iconos legacy, splash,
//    iconos de la PWA y los gráficos de la ficha de Google Play.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { run, step } from "./lib/mobile.mjs";

const RES = join("android", "app", "src", "main", "res");
const STORE_DIR = join("docs", "play-assets");
const ICONS_DIR = join("public", "icons");
const ARTIKO_SVG = join("scripts", "artiko", ".out", "artiko.svg");

const MINT = "#C9E8E4";
const MINT_EDGE = "#3F8A7E";
const CREAM = "#FBF8F3";
const SKY = "#CFE3F5";
const LAVENDER = "#E0DAF2";
const PEACH = "#FBDCC8";

step("Exportar el SVG de Artiko");
run("npx", ["vitest", "run", "-c", "vitest.assets.config.mts"]);
const artikoSvg = readFileSync(ARTIKO_SVG, "utf8");
const artikoDataUri = `data:image/svg+xml;base64,${Buffer.from(artikoSvg).toString("base64")}`;

/**
 * Lienzo de width×height. `artiko` = alto de Artiko en proporción al lado corto.
 * `plate` = forma de fondo bajo Artiko (null, "square", "rounded", "circle" o "disc" centrado).
 */
function page({ width, height, background = "transparent", plate = null, artiko, extras = "" }) {
  const short = Math.min(width, height);
  const plates = {
    square: `<div class="plate" style="inset:0;background:${MINT}"></div>`,
    rounded: `<div class="plate" style="inset:0;background:${MINT};border-radius:22%"></div>`,
    circle: `<div class="plate" style="inset:0;background:${MINT};border-radius:50%"></div>`,
    disc: `<div class="plate" style="width:${short * 0.62}px;height:${short * 0.62}px;left:${(width - short * 0.62) / 2}px;top:${(height - short * 0.62) / 2}px;background:${MINT};border-radius:50%;box-shadow:inset 0 0 0 ${Math.max(2, short * 0.008)}px ${MINT_EDGE}"></div>`,
  };
  return `<!doctype html><html><head><style>
    html,body{margin:0;background:transparent}
    #c{position:relative;width:${width}px;height:${height}px;background:${background};overflow:hidden}
    .plate,.dot{position:absolute}
    .dot{border-radius:50%}
    img{position:absolute;left:50%;top:50%;height:${short * artiko}px;transform:translate(-50%,-50%)}
  </style></head><body><div id="c">${extras}${plate ? plates[plate] : ""}<img src="${artikoDataUri}"></div></body></html>`;
}

const dot = (x, y, r, color) =>
  `<div class="dot" style="left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;background:${color}"></div>`;

const assets = [];
const add = (path, spec) => assets.push({ path, spec });

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [density, scale] of Object.entries(DENSITIES)) {
  const dir = join(RES, `mipmap-${density}`);
  // Adaptativo: lienzo de 108 dp; Artiko dentro de la zona segura (círculo de 66 dp).
  const foreground = Math.round(108 * scale);
  add(join(dir, "ic_launcher_foreground.png"), { width: foreground, height: foreground, artiko: 0.56 });
  const legacy = Math.round(48 * scale);
  add(join(dir, "ic_launcher.png"), { width: legacy, height: legacy, plate: "rounded", artiko: 0.8 });
  add(join(dir, "ic_launcher_round.png"), { width: legacy, height: legacy, plate: "circle", artiko: 0.74 });
}

// Splash anterior a Android 12 (desde 12 el sistema usa el icono adaptativo sobre crema).
const splash = (path, width, height) => add(path, { width, height, background: CREAM, plate: "disc", artiko: 0.46 });
splash(join(RES, "drawable", "splash.png"), 480, 320);
const SPLASH_SIZES = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [density, [w, h]] of Object.entries(SPLASH_SIZES)) {
  splash(join(RES, `drawable-port-${density}`, "splash.png"), w, h);
  splash(join(RES, `drawable-land-${density}`, "splash.png"), h, w);
}

// PWA (manifest.json): normal y maskable (zona segura del 80 %).
add(join(ICONS_DIR, "icon-192x192.png"), { width: 192, height: 192, plate: "rounded", artiko: 0.8 });
add(join(ICONS_DIR, "icon-512x512.png"), { width: 512, height: 512, plate: "rounded", artiko: 0.8 });
add(join(ICONS_DIR, "maskable-512x512.png"), { width: 512, height: 512, plate: "square", artiko: 0.62 });

// Ficha de Google Play: icono 512×512 sin transparencia y gráfico de funciones 1024×500.
add(join(STORE_DIR, "icono-512.png"), { width: 512, height: 512, background: MINT, artiko: 0.8 });
add(join(STORE_DIR, "grafico-funciones-1024x500.png"), {
  width: 1024,
  height: 500,
  background: CREAM,
  plate: "disc",
  artiko: 0.56,
  extras: dot(150, 110, 70, SKY) + dot(900, 400, 90, LAVENDER) + dot(860, 90, 46, PEACH) + dot(110, 430, 34, MINT),
});

step(`Dibujar ${assets.length} imágenes`);
// CHROMIUM_PATH: usar otro Chromium (p. ej. el de un contenedor con una versión distinta de Playwright).
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const browserPage = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { path, spec } of assets) {
    await browserPage.setViewportSize({ width: spec.width, height: spec.height });
    await browserPage.setContent(page(spec));
    await browserPage.locator("img").evaluate((img) => img.decode());
    mkdirSync(dirname(path), { recursive: true });
    await browserPage.locator("#c").screenshot({ path, omitBackground: true });
    process.stdout.write(`Generado ${path} (${spec.width}×${spec.height})\n`);
  }
} finally {
  await browser.close();
}

// Favicon e icono SVG de la web: Artiko sobre la placa menta.
const inner = artikoSvg.replace(/^<svg /, '<svg x="76" y="56" width="360" height="400" ');
writeFileSync(
  join(ICONS_DIR, "icon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  <!-- Artiko, la mascota, sobre menta pastel (lo genera scripts/generate-android-assets.mjs). -->\n  <rect width="512" height="512" rx="112" fill="${MINT}" />\n  ${inner}\n</svg>\n`
);
process.stdout.write(`Generado ${join(ICONS_DIR, "icon.svg")}\n`);
