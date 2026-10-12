"use client";

import { LazyMotion, useReducedMotion, type TargetAndTransition } from "motion/react";
import * as m from "motion/react-m";
import type { ArtikoEmotion } from "@/lib/mascot/mascot";
import { ArtikoFigure, type ArtikoFigureProps } from "./ArtikoFigure";

const loadMotionFeatures = () => import("./motionFeatures").then((module) => module.default);

/**
 * Entrada de cada emoción (una vez, al aparecer o al cambiar): saltos y
 * rebotes cortos. Sin temblores ni sacudidas que transmitan angustia.
 */
const ENTRANCES: Readonly<Record<ArtikoEmotion, TargetAndTransition>> = {
  welcome: { y: [0, -22, 0, -8, 0], transition: { duration: 0.9, ease: "easeOut" } },
  happy: { scale: [0.94, 1.04, 1], transition: { duration: 0.4 } },
  fire_streak: { scale: [0.9, 1.08, 1], transition: { duration: 0.5 } },
  waiting: { rotate: [0, -6, -3], transition: { duration: 0.6, ease: "easeOut" } },
  flexing: { scale: [0.9, 1.1, 1], y: [0, -6, 0], transition: { duration: 0.5 } },
  heads_up: { x: [0, -3, 3, 0], transition: { duration: 0.5 } },
  celebrating: { y: [0, -18, 0, -10, 0], rotate: [0, -4, 4, 0], transition: { duration: 1 } },
  sleepy: { rotate: [0, 2, 0], transition: { duration: 1.2, ease: "easeInOut" } },
  thinking: { rotate: [0, -3, 0], transition: { duration: 0.6 } },
};

/**
 * Artiko animado para /app. El dibujo es ArtikoFigure (SVG puro); aquí solo
 * se suma la entrada por emoción con Framer Motion, cargado de forma perezosa
 * para que la landing nunca lo descargue. Con movimiento reducido, quieto.
 */
export function ArtikoMascot({ emotion = "happy", className, ...figureProps }: ArtikoFigureProps) {
  const prefersReducedMotion = useReducedMotion();
  const figure = <ArtikoFigure emotion={emotion} {...figureProps} />;

  if (prefersReducedMotion) return <span className={className}>{figure}</span>;

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <m.span key={emotion} className={`inline-block ${className ?? ""}`} animate={ENTRANCES[emotion]}>
        {figure}
      </m.span>
    </LazyMotion>
  );
}
