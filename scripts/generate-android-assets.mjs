#!/usr/bin/env node
// npm run generate:android-assets — icono adaptativo, iconos legacy, splash y
// gráficos de la ficha de Play con la paleta pastel de docs/DESIGN.md: hueso
// azul clínico sobre menta, lienzo crema. Sin dependencias (encoder propio) y
// determinista: correrlo dos veces da los mismos archivos.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { encodePng } from "./lib/png.mjs";

const RES = join("android", "app", "src", "main", "res");
const STORE_DIR = join("docs", "play-assets");

const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
const CLINIC = hex("#1F4E79");
const MINT = hex("#C9E8E4");
const MINT_EDGE = hex("#3F8A7E");
const CREAM = hex("#FBF8F3");
const SKY = hex("#CFE3F5");
const LAVENDER = hex("#E0DAF2");
const PEACH = hex("#FBDCC8");

const SAMPLES = 4; // 4×4 muestras por píxel: bordes suaves

/** Distancia con signo a un hueso centrado en el origen, girado -45°, de largo total `size`. */
function boneDistance(x, y, size) {
  const angle = Math.PI / 4;
  const u = x * Math.cos(angle) - y * Math.sin(angle);
  const v = x * Math.sin(angle) + y * Math.cos(angle);
  const half = size * 0.3;
  const bar = size * 0.085;
  const knob = size * 0.115;
  const knobOffset = knob * 1.05;
  // La barra termina antes del centro de los lóbulos: su punta redonda no asoma entre ellos.
  const barEnd = half - bar;
  const clampedU = Math.max(-barEnd, Math.min(barEnd, u));
  const barDistance = Math.hypot(u - clampedU, v) - bar;
  const knobs = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => Math.hypot(u - sx * half, v - sy * knobOffset) - knob));
  return Math.min(barDistance, ...knobs);
}

const circleDistance = (x, y, radius) => Math.hypot(x, y) - radius;

/**
 * Pinta capas de atrás hacia adelante. Cada capa: { color, distance(x, y) }
 * en coordenadas de píxel; dentro = distancia < 0. `background` null = transparente.
 */
function render(width, height, background, layers) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      let [r, g, b, a] = background ? [...background, 1] : [0, 0, 0, 0];
      for (const layer of layers) {
        // Fuera de su caja con margen no hace falta muestrear.
        if (layer.distance(px + 0.5, py + 0.5) > 2) continue;
        let hits = 0;
        for (let sy = 0; sy < SAMPLES; sy += 1) {
          for (let sx = 0; sx < SAMPLES; sx += 1) {
            if (layer.distance(px + (sx + 0.5) / SAMPLES, py + (sy + 0.5) / SAMPLES) < 0) hits += 1;
          }
        }
        const coverage = hits / (SAMPLES * SAMPLES);
        if (coverage === 0) continue;
        const outA = coverage + a * (1 - coverage);
        [r, g, b] = [0, 1, 2].map((i) => (layer.color[i] * coverage + [r, g, b][i] * a * (1 - coverage)) / outA);
        a = outA;
      }
      pixels.set([Math.round(r), Math.round(g), Math.round(b), Math.round(a * 255)], (py * width + px) * 4);
    }
  }
  return pixels;
}

function write(path, width, height, pixels) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(width, height, pixels));
  process.stdout.write(`Generado ${path} (${width}×${height})\n`);
}

const bone = (cx, cy, size, color = CLINIC) => ({ color, distance: (x, y) => boneDistance(x - cx, y - cy, size) });
const disc = (cx, cy, radius, color) => ({ color, distance: (x, y) => circleDistance(x - cx, y - cy, radius) });
const roundedSquare = (size, radius, color) => ({
  color,
  distance: (x, y) => {
    const half = size / 2;
    const qx = Math.abs(x - half) - (half - radius);
    const qy = Math.abs(y - half) - (half - radius);
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
  },
});

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

for (const [density, scale] of Object.entries(DENSITIES)) {
  const dir = join(RES, `mipmap-${density}`);
  // Adaptativo: lienzo de 108 dp; el hueso queda dentro de la zona segura de 66 dp.
  const foreground = Math.round(108 * scale);
  write(join(dir, "ic_launcher_foreground.png"), foreground, foreground, render(foreground, foreground, null, [
    bone(foreground / 2, foreground / 2, foreground * 0.5),
  ]));
  // Legacy (Android 7.x): cuadrado redondeado y redondo, de 48 dp.
  const legacy = Math.round(48 * scale);
  write(join(dir, "ic_launcher.png"), legacy, legacy, render(legacy, legacy, null, [
    roundedSquare(legacy, legacy * 0.22, MINT),
    bone(legacy / 2, legacy / 2, legacy * 0.72),
  ]));
  write(join(dir, "ic_launcher_round.png"), legacy, legacy, render(legacy, legacy, null, [
    disc(legacy / 2, legacy / 2, legacy / 2, MINT),
    bone(legacy / 2, legacy / 2, legacy * 0.7),
  ]));
}

/** Splash anterior a Android 12 (desde 12 lo pinta el sistema con el tema). */
function splash(path, width, height) {
  const short = Math.min(width, height);
  write(path, width, height, render(width, height, CREAM, [
    disc(width / 2, height / 2, short * 0.2, MINT),
    bone(width / 2, height / 2, short * 0.26),
  ]));
}
splash(join(RES, "drawable", "splash.png"), 480, 320);
const SPLASH_SIZES = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [density, [w, h]] of Object.entries(SPLASH_SIZES)) {
  splash(join(RES, `drawable-port-${density}`, "splash.png"), w, h);
  splash(join(RES, `drawable-land-${density}`, "splash.png"), h, w);
}

// Ficha de Google Play: icono 512×512 (sin transparencia) y gráfico de funciones 1024×500.
write(join(STORE_DIR, "icono-512.png"), 512, 512, render(512, 512, MINT, [bone(256, 256, 360)]));
write(join(STORE_DIR, "grafico-funciones-1024x500.png"), 1024, 500, render(1024, 500, CREAM, [
  disc(150, 110, 70, SKY),
  disc(900, 400, 90, LAVENDER),
  disc(860, 90, 46, PEACH),
  disc(512, 250, 160, MINT),
  disc(512, 250, 160 - 4, MINT),
  { color: MINT_EDGE, distance: (x, y) => Math.abs(circleDistance(x - 512, y - 250, 160)) - 3 },
  bone(512, 250, 220),
]));
