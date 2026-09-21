#!/usr/bin/env node
// Genera los iconos PNG requeridos por manifest.json (192, 512, maskable-512)
// usando un encoder PNG mínimo escrito a mano (sin canvas/sharp): dibuja un
// icono de "hueso" sobre un canvas RGBA en memoria y lo comprime con zlib,
// que ya viene incluido en Node.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, "../public/icons");

const BRAND_TEAL = [15, 118, 110, 255];
const WHITE = [255, 255, 255, 255];

class RgbaCanvas {
  constructor(size) {
    this.size = size;
    this.pixels = new Uint8ClampedArray(size * size * 4);
  }

  fill(color) {
    for (let i = 0; i < this.pixels.length; i += 4) {
      this.pixels.set(color, i);
    }
  }

  setPixel(x, y, color) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    const index = (Math.floor(y) * this.size + Math.floor(x)) * 4;
    this.pixels.set(color, index);
  }

  fillCircle(cx, cy, radius, color) {
    const radiusSquared = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
        const dx = x - cx + 0.5;
        const dy = y - cy + 0.5;
        if (dx * dx + dy * dy <= radiusSquared) this.setPixel(x, y, color);
      }
    }
  }

  fillHorizontalCapsule(xStart, xEnd, cy, thickness, color) {
    const halfThickness = thickness / 2;
    for (let y = Math.floor(cy - halfThickness); y <= Math.ceil(cy + halfThickness); y += 1) {
      if (Math.abs(y + 0.5 - cy) > halfThickness) continue;
      for (let x = Math.floor(xStart); x <= Math.ceil(xEnd); x += 1) {
        this.setPixel(x, y, color);
      }
    }
    this.fillCircle(xStart, cy, halfThickness, color);
    this.fillCircle(xEnd, cy, halfThickness, color);
  }
}

/**
 * Dibuja el glifo de "hueso" (🦴) de la marca Artikare: una barra central
 * con dos pares de lóbulos redondeados en los extremos. `maskable` reduce el
 * tamaño del glifo para respetar la zona segura (~80% de diámetro) que
 * exige Android/Play Store para íconos adaptativos.
 */
function drawBoneIcon(canvas, { maskable }) {
  canvas.fill(BRAND_TEAL);

  const size = canvas.size;
  const cx = size / 2;
  const cy = size / 2;

  const boneWidth = size * (maskable ? 0.5 : 0.72);
  const barThickness = boneWidth * 0.26;
  const xStart = cx - boneWidth / 2 + barThickness / 2;
  const xEnd = cx + boneWidth / 2 - barThickness / 2;

  canvas.fillHorizontalCapsule(xStart, xEnd, cy, barThickness, WHITE);

  const knobRadius = boneWidth * 0.19;
  const knobOffsetY = knobRadius * 0.95;
  canvas.fillCircle(xStart, cy - knobOffsetY, knobRadius, WHITE);
  canvas.fillCircle(xStart, cy + knobOffsetY, knobRadius, WHITE);
  canvas.fillCircle(xEnd, cy - knobOffsetY, knobRadius, WHITE);
  canvas.fillCircle(xEnd, cy + knobOffsetY, knobRadius, WHITE);
}

function crc32(buffer) {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    crc32.table = table;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc = table[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function encodePng(canvas) {
  const { size, pixels } = canvas;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // profundidad de bits
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compresión
  ihdrData[11] = 0; // filtro
  ihdrData[12] = 0; // sin interlace

  const rowBytes = size * 4;
  const raw = Buffer.alloc((rowBytes + 1) * size);
  const pixelBuffer = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // sin filtro por fila
    pixelBuffer.copy(raw, rowStart + 1, y * rowBytes, (y + 1) * rowBytes);
  }
  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function generateIcon(fileName, size, { maskable = false } = {}) {
  const canvas = new RgbaCanvas(size);
  drawBoneIcon(canvas, { maskable });
  const outputPath = path.join(ICONS_DIR, fileName);
  writeFileSync(outputPath, encodePng(canvas));
  console.log(`Generado ${fileName} (${size}x${size}${maskable ? ", maskable" : ""})`);
}

mkdirSync(ICONS_DIR, { recursive: true });
generateIcon("icon-192x192.png", 192);
generateIcon("icon-512x512.png", 512);
generateIcon("maskable-512x512.png", 512, { maskable: true });
