/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dexaVaultStore } from "@/lib/dashboard/dexaVault";
import { patientProfileStore, emptyPatientProfile } from "@/lib/dashboard/patientProfile";
import { DAILY_LEARNING_XP_CAP, LEARNING_XP, learningXpOn } from "@/lib/gamification/learning";
import { EMPTY_GAME_PROGRESS, gameProgressStore } from "@/lib/gamification/progress";
import { LESSONS } from "@/lib/learn/lessons";
import { LearnHub } from "./LearnHub";

const playSound = vi.fn();
vi.mock("@/lib/feedback/sounds", () => ({ playSound: (name: string) => playSound(name) }));
vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

afterEach(() => {
  gameProgressStore.write(EMPTY_GAME_PROGRESS);
  patientProfileStore.write(emptyPatientProfile);
  dexaVaultStore.write([]);
  window.localStorage.clear();
  playSound.mockClear();
});

function openAndFinish(title: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }));
  fireEvent.click(screen.getByRole("button", { name: /Terminé la lección/ }));
}

describe("LearnHub", () => {
  it("lists every lesson with a disclaimer that asks to see a doctor", () => {
    render(<LearnHub />);
    expect(screen.getByRole("heading", { level: 1, name: /Aprender/ })).toBeInTheDocument();
    expect(screen.getAllByText(/Consulta a tu médico/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("listitem")).toHaveLength(LESSONS.length);
  });

  it("shows three doctor questions and rewards a finished lesson once per day with fanfare", () => {
    render(<LearnHub />);
    fireEvent.click(screen.getByRole("button", { name: /Gota: cuando/ }));
    fireEvent.click(screen.getByRole("button", { name: /Preguntar a mi médico/ }));
    expect(screen.getByText("¿Debo medir mi ácido úrico?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Terminé la lección/ }));

    expect(screen.getByText(`+${LEARNING_XP.lesson} XP`)).toBeInTheDocument();
    expect(playSound).toHaveBeenCalledWith("fanfare");
    fireEvent.click(screen.getByRole("button", { name: "Seguir" }));

    openAndFinish("Gota: cuando");
    expect(screen.queryByText(/\+\d+ XP/)).toBeNull();
    expect(screen.getByText(/Repasar también es cuidarte/)).toBeInTheDocument();
  });

  it("stops adding XP at the daily cap but still lets the person keep learning", () => {
    render(<LearnHub />);
    const titles = ["Gota: cuando", "Fibromialgia", "Dolor de espalda baja", "Crujidos", "Menopausia y huesos"];
    titles.slice(0, -1).forEach((title) => {
      openAndFinish(title);
      fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
    });
    openAndFinish(titles[titles.length - 1]);

    expect(screen.queryByText(/\+\d+ XP/)).toBeNull();
    expect(screen.getByText(/Hoy ya sumaste todo el XP de aprendizaje/)).toBeInTheDocument();
    const [todayKeys] = Object.values(gameProgressStore.getSnapshot().learning);
    expect(learningXpOn(todayKeys)).toBe(DAILY_LEARNING_XP_CAP);
    fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
    expect(screen.getByText(/5 de \d+ lecciones leídas/)).toBeInTheDocument();
  });

  it("searches the glossary and shows the warning signs", () => {
    render(<LearnHub />);
    fireEvent.click(screen.getByRole("button", { name: "Glosario" }));
    fireEvent.change(screen.getByLabelText("Busca una palabra"), { target: { value: "t-score" } });
    expect(screen.getByText("T-score")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Señales" }));
    expect(screen.getByText("Fractura con un golpe leve")).toBeInTheDocument();
  });

  it("hides lessons that suggest movement when there is a red flag", () => {
    patientProfileStore.write({ ...emptyPatientProfile, hasFractureHistory: true });
    render(<LearnHub />);
    expect(screen.queryByText("Ejercicio seguro para huesos y articulaciones")).toBeNull();
  });
});
