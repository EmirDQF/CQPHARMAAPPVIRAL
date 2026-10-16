/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { patientProfileStore, emptyPatientProfile } from "@/lib/dashboard/patientProfile";
import { LEARNING_XP } from "@/lib/gamification/learning";
import { EMPTY_MINI_GAME_SCORES, miniGameScoresStore } from "@/lib/gamification/miniGames";
import { EMPTY_GAME_PROGRESS, gameProgressStore } from "@/lib/gamification/progress";
import { GamesHub } from "./GamesHub";

const playSound = vi.fn();
vi.mock("@/lib/feedback/sounds", () => ({ playSound: (name: string) => playSound(name) }));
vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

afterEach(() => {
  gameProgressStore.write(EMPTY_GAME_PROGRESS);
  miniGameScoresStore.write(EMPTY_MINI_GAME_SCORES);
  patientProfileStore.write(emptyPatientProfile);
  window.localStorage.clear();
  playSound.mockClear();
});

function answerEveryCard() {
  while (!screen.queryByText(/Acertaste/)) {
    fireEvent.click(screen.getAllByRole("button", { name: /Mito|Realidad/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Siguiente|Ver resultado/ }));
  }
}

describe("GamesHub", () => {
  it("lists six untimed games", () => {
    render(<GamesHub />);
    expect(screen.getByRole("heading", { level: 1, name: /Jugar/ })).toBeInTheDocument();
    expect(screen.getAllByText(/min · sin reloj/)).toHaveLength(6);
  });

  it("plays Mito o Realidad end to end: explanation, sounds, result, XP and reward", () => {
    render(<GamesHub />);
    fireEvent.click(screen.getByRole("button", { name: /Mito o Realidad/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /Mito|Realidad/ })[0]);
    expect(screen.getByText(/Referencia general/)).toBeInTheDocument();
    expect(playSound.mock.calls.some(([name]) => name === "correct" || name === "softError")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    answerEveryCard();
    expect(screen.getByText(/Cada respuesta, correcta o no/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Terminar y sumar XP/ }));

    expect(screen.getByText(`+${LEARNING_XP.game} XP`)).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledWith("fanfare");
    expect(miniGameScoresStore.getSnapshot().best["mito-o-realidad"]).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
    expect(screen.getByText(/Mejor:/)).toBeInTheDocument();
  });

  it("lets the person replay; the XP only counts once that day", () => {
    render(<GamesHub />);
    for (let round = 0; round < 2; round += 1) {
      fireEvent.click(screen.getByRole("button", { name: /Mito o Realidad/ }));
      answerEveryCard();
      fireEvent.click(screen.getByRole("button", { name: /Terminar y sumar XP/ }));
      if (round === 1) expect(screen.queryByText(/\+\d+ XP/)).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
    }
  });

  it("finds the fall risks in Casa segura", () => {
    render(<GamesHub />);
    fireEvent.click(screen.getByRole("button", { name: /Casa segura/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cable cruzando el paso" }));
    expect(screen.getByText(/Pásalos junto a la pared/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Barra de apoyo en el baño" }));
    expect(screen.getByText(/La barra da un apoyo firme/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Terminar por ahora" }));
    expect(screen.getByText(/Acertaste 1 de/)).toBeInTheDocument();
  });

  it("fills a plate with four foods", () => {
    render(<GamesHub />);
    fireEvent.click(screen.getByRole("button", { name: /Arma tu plato/ }));
    for (let pick = 0; pick < 4; pick += 1) {
      const options = screen.getAllByRole("button", { pressed: false }).filter((button) => button.closest("ul"));
      fireEvent.click(options[0]);
    }
    fireEvent.click(screen.getByRole("button", { name: "Ver resultado" }));
    expect(screen.getByText(/de 4\./)).toBeInTheDocument();
  });

  it("matches memory pairs without any timer", () => {
    render(<GamesHub />);
    fireEvent.click(screen.getByRole("button", { name: /Memoria articular/ }));
    const covered = screen.getAllByRole("button", { name: "Carta tapada" });
    expect(covered.length).toBeGreaterThanOrEqual(8);
    fireEvent.click(covered[0]);
    expect(screen.getAllByRole("button", { name: "Carta tapada" })).toHaveLength(covered.length - 1);
  });

  it("hides the movement game while a red flag is active", () => {
    patientProfileStore.write({ ...emptyPatientProfile, hasFractureHistory: true });
    render(<GamesHub />);
    expect(screen.queryByText("Escudo Óseo del Día")).toBeNull();
    expect(screen.getByText(/ocultamos los juegos que hablan de movimiento/)).toBeInTheDocument();
  });
});

describe("Cofre del día", () => {
  it("opens once a day with the chest sound and shows a fact with its source", async () => {
    render(<GamesHub />);
    fireEvent.click(await screen.findByRole("button", { name: "Abrir el cofre" }));
    expect(playSound).toHaveBeenCalledWith("chest");
    expect(screen.getByText(/Referencia general: .*Consulta a tu médico/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abrir el cofre" })).toBeNull();
  });
});

describe("learning badges in the reward", () => {
  it("shows a new badge with the fanfare when a game completes a set", () => {
    gameProgressStore.write({ ...EMPTY_GAME_PROGRESS, learning: { "2020-01-01": ["lesson:prevencion-de-caidas"] } });
    render(<GamesHub />);
    fireEvent.click(screen.getByRole("button", { name: /Casa segura/ }));
    fireEvent.click(screen.getByRole("button", { name: "Terminar por ahora" }));
    fireEvent.click(screen.getByRole("button", { name: /Terminar y sumar XP/ }));
    expect(screen.getByText(/Nueva insignia: Hogar sin tropiezos/)).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledWith("fanfare");
  });
});
