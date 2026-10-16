import { feedbackPreferencesStore, type FeedbackPreferences } from "./preferences";

/**
 * Sonidos de Artikare, sintetizados al vuelo con Web Audio: notas propias
 * (sin archivos ni melodías de terceros, sin derechos de autor). Cortos,
 * suaves y alegres, para premiar cada paso sin molestar. Se apagan en
 * Ajustes → "Vibración, sonidos y celebraciones".
 */
export type SoundName =
  | "tap"
  | "success"
  | "complete"
  | "celebrate"
  | "gentle"
  | "correct"
  | "softError"
  | "fanfare"
  | "streak"
  | "chest";

interface Note {
  /** Frecuencia en Hz. */
  frequency: number;
  /** Inicio desde el disparo, en segundos. */
  start: number;
  duration: number;
  /** Volumen pico (0 a 1); todo se mantiene bajo para no asustar. */
  volume: number;
  wave: OscillatorType;
}

const note = (frequency: number, start: number, duration: number, volume = 0.16, wave: OscillatorType = "triangle"): Note => ({
  frequency,
  start,
  duration,
  volume,
  wave,
});

// Escala de Do mayor (Hz): siempre consonante y alegre.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const A4 = 440;
const F4 = 349.23;
const C6 = 1046.5;
const E6 = 1318.51;
const G6 = 1567.98;
const G4 = 392;
const D5 = 587.33;
const A5 = 880;
const D4 = 293.66;
const B4 = 493.88;

export const SOUNDS: Readonly<Record<SoundName, readonly Note[]>> = {
  /** Toque de botón: un "pop" breve y apenas audible. */
  tap: [note(880, 0, 0.05, 0.06, "sine")],
  /** Acierto (toma anotada, chequeo guardado): dos notas que suben. */
  success: [note(E5, 0, 0.12), note(C6, 0.09, 0.22), note(C6 * 2, 0.09, 0.18, 0.03, "sine")],
  /** Misión cumplida: arpegio corto. */
  complete: [note(C5, 0, 0.1), note(E5, 0.08, 0.1), note(G5, 0.16, 0.1), note(C6, 0.24, 0.3)],
  /** Meta del día, logro o fin del primer arranque: arpegio y acorde final. */
  celebrate: [
    note(G5, 0, 0.1),
    note(C6, 0.09, 0.1),
    note(E6, 0.18, 0.1),
    note(G6, 0.27, 0.45, 0.12),
    note(C6, 0.27, 0.45, 0.1),
    note(E6, 0.27, 0.45, 0.08, "sine"),
  ],
  /** Deshacer o respuesta a revisar: dos notas que bajan, sin dramatismo. */
  gentle: [note(A4, 0, 0.12, 0.1, "sine"), note(F4, 0.1, 0.2, 0.1, "sine")],
  /** Respuesta correcta en un juego: acorde mayor que sube (Do-Mi-Sol-Do). */
  correct: [note(C5, 0, 0.12), note(E5, 0.06, 0.14), note(G5, 0.12, 0.16), note(C6, 0.18, 0.28, 0.12)],
  /** Respuesta a revisar: un "hmm" grave y corto, amable, nunca un zumbido de castigo. */
  softError: [note(B4, 0, 0.14, 0.08, "sine"), note(G4, 0.12, 0.26, 0.08, "sine")],
  /** Recompensa (lección o juego completo): fanfarria breve de ~1.5 s. */
  fanfare: [
    note(G4, 0, 0.14, 0.12),
    note(C5, 0.14, 0.14, 0.12),
    note(E5, 0.28, 0.14, 0.12),
    note(G5, 0.42, 0.3, 0.13),
    note(E5, 0.74, 0.12, 0.11),
    note(G5, 0.86, 0.6, 0.14),
    note(C6, 0.86, 0.6, 0.11),
    note(E6, 0.86, 0.6, 0.06, "sine"),
  ],
  /** La racha avanza: tres notas brillantes que suben. */
  streak: [note(D5, 0, 0.1, 0.12), note(G5, 0.08, 0.1, 0.12), note(D5 * 2, 0.16, 0.3, 0.1, "sine")],
  /** Cofre del día: un destello suave que se abre. */
  chest: [
    note(D4, 0, 0.12, 0.1, "sine"),
    note(A4, 0.1, 0.12, 0.1, "sine"),
    note(A5, 0.2, 0.18, 0.1),
    note(E6, 0.32, 0.36, 0.06, "sine"),
  ],
};

const ATTACK_SECONDS = 0.008;

export interface SoundDependencies {
  readPreferences: () => FeedbackPreferences;
  isPageHidden: () => boolean;
  getContext: () => AudioContext | null;
}

let sharedContext: AudioContext | null | undefined;

/** Un solo AudioContext por app, creado en el primer toque (los navegadores lo exigen). */
function browserContext(): AudioContext | null {
  if (sharedContext !== undefined) return sharedContext;
  const AudioContextClass =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  sharedContext = AudioContextClass ? new AudioContextClass() : null;
  return sharedContext;
}

function defaultDependencies(): SoundDependencies {
  return {
    readPreferences: feedbackPreferencesStore.getSnapshot,
    isPageHidden: () => typeof document !== "undefined" && document.visibilityState === "hidden",
    getContext: browserContext,
  };
}

function scheduleNote(context: AudioContext, { frequency, start, duration, volume, wave }: Note): void {
  const startAt = context.currentTime + start;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

/** true si sonó. Nunca lanza: sin audio (equipo antiguo o pruebas), no pasa nada. */
export function playSound(name: SoundName, deps: SoundDependencies = defaultDependencies()): boolean {
  if (!deps.readPreferences().sound || deps.isPageHidden()) return false;
  try {
    const context = deps.getContext();
    if (!context) return false;
    if (context.state === "suspended") void context.resume();
    SOUNDS[name].forEach((item) => scheduleNote(context, item));
    return true;
  } catch {
    return false;
  }
}
