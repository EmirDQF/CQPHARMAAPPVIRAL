/**
 * Artiko, la mascota de Artikare: una cápsula bioactiva atlética con tenis
 * deportivos, cinturón articular brillante y ojos gigantes. Acompaña y
 * recuerda; nunca diagnostica, nunca da consejo médico, nunca llora ni
 * reprocha. El nombre vive solo aquí: cambiarlo = editar `MASCOT.name`.
 */
export const MASCOT = {
  name: "Artiko",
  description: "una cápsula atlética con tenis deportivos y un cinturón brillante",
} as const;

export const ARTIKO_EMOTIONS = [
  "welcome",
  "happy",
  "fire_streak",
  "waiting",
  "flexing",
  "heads_up",
  "celebrating",
  "sleepy",
  "thinking",
] as const;
export type ArtikoEmotion = (typeof ARTIKO_EMOTIONS)[number];

/** Accesorios solo estéticos que se desbloquean con constancia (nunca con compras). */
export const ARTIKO_ACCESSORIES = ["cap", "scarf", "glasses", "medal"] as const;
export type ArtikoAccessory = (typeof ARTIKO_ACCESSORIES)[number];

export const ACCESSORY_NAMES: Readonly<Record<ArtikoAccessory, string>> = {
  cap: "gorra deportiva",
  scarf: "bufanda",
  glasses: "lentes",
  medal: "medalla del saber",
};

const EMOTION_DESCRIPTIONS: Readonly<Record<ArtikoEmotion, string>> = {
  welcome: "te saluda con un salto",
  happy: "sonríe contento",
  fire_streak: "luce su cinta y llamas de racha",
  waiting: "te mira con ojos grandes y brillantes, curioso",
  flexing: "saca músculo: misiones del día listas",
  heads_up: "te avisa con un megáfono simpático",
  celebrating: "celebra con los brazos arriba",
  sleepy: "descansa con un poco de sueño",
  thinking: "piensa con la mano en el mentón",
};

/** Nombre accesible del dibujo (role="img"). */
export function artikoLabel(emotion: ArtikoEmotion, accessories: readonly ArtikoAccessory[] = []): string {
  const wearing = accessories.length > 0 ? `, con ${accessories.map((item) => ACCESSORY_NAMES[item]).join(" y ")}` : "";
  return `${MASCOT.name} ${EMOTION_DESCRIPTIONS[emotion]}${wearing}`;
}

export type ArmPose = "rest" | "wave" | "up" | "flex" | "chin" | "megaphone";
export type EyeStyle = "open" | "sparkle" | "closed" | "lookUp";
export type MouthStyle = "smile" | "grin" | "open" | "curious" | "rest";
export type ArtikoEffect = "flames" | "headband" | "confetti" | "zzz" | "thought" | "sparkles" | "soundWaves";

export interface ArtikoPose {
  arms: ArmPose;
  eyes: EyeStyle;
  mouth: MouthStyle;
  effects: readonly ArtikoEffect[];
  /** Ladeo del cuerpo en grados (curiosidad, sueño). */
  tilt: number;
}

/** Pose de cada emoción: data pura, sin lágrimas ni temblores angustiantes. */
export const ARTIKO_POSES: Readonly<Record<ArtikoEmotion, ArtikoPose>> = {
  welcome: { arms: "wave", eyes: "sparkle", mouth: "grin", effects: ["sparkles"], tilt: 0 },
  happy: { arms: "rest", eyes: "open", mouth: "smile", effects: [], tilt: 0 },
  fire_streak: { arms: "flex", eyes: "open", mouth: "grin", effects: ["flames", "headband"], tilt: 0 },
  waiting: { arms: "rest", eyes: "sparkle", mouth: "curious", effects: [], tilt: -8 },
  flexing: { arms: "flex", eyes: "open", mouth: "grin", effects: ["sparkles"], tilt: 0 },
  heads_up: { arms: "megaphone", eyes: "open", mouth: "open", effects: ["soundWaves"], tilt: 0 },
  celebrating: { arms: "up", eyes: "sparkle", mouth: "grin", effects: ["confetti"], tilt: 0 },
  sleepy: { arms: "rest", eyes: "closed", mouth: "rest", effects: ["zzz"], tilt: 5 },
  thinking: { arms: "chin", eyes: "lookUp", mouth: "rest", effects: ["thought"], tilt: -4 },
};
