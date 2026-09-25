import { PAIN_LEVEL_MAX } from "../clinical/constants";
import type { PainLogEntry } from "./types";

/** Un día con dolor 0 es un día registrado: se dibuja una marca mínima, no una barra vacía. */
export const MIN_VISIBLE_BAR_HEIGHT = 2;

const BAR_GAP = 2;
const MIN_BAR_WIDTH = 1;

export interface PainBar {
  x: number;
  y: number;
  width: number;
  height: number;
  date: string;
  isPainFree: boolean;
}

export function buildPainBars(
  entries: readonly PainLogEntry[],
  { width, height }: { width: number; height: number }
): PainBar[] {
  if (entries.length === 0) return [];
  const slotWidth = width / entries.length;

  return entries.map((entry, index) => {
    const isPainFree = entry.painLevel === 0;
    const barHeight = isPainFree
      ? MIN_VISIBLE_BAR_HEIGHT
      : (entry.painLevel / PAIN_LEVEL_MAX) * height;
    return {
      x: index * slotWidth,
      y: height - barHeight,
      width: Math.max(slotWidth - BAR_GAP, MIN_BAR_WIDTH),
      height: barHeight,
      date: entry.date,
      isPainFree,
    };
  });
}
