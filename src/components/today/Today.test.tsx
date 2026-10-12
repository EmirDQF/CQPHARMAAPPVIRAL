/** @vitest-environment jsdom */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MyDay } from "@/components/dashboard/myday/MyDay";
import type { DeferredDose } from "@/hooks/useDeferredDose";
import { ACTIVITY_CATALOG } from "@/lib/activities/catalog";
import { selectDailyMissions } from "@/lib/activities/rotation";
import type { ActivityKind } from "@/lib/activities/schemas";
import { painLogStore } from "@/lib/dashboard/painLog";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { pillboxStore } from "@/lib/dashboard/pillbox";
import { EMPTY_GAME_PROGRESS, gameProgressStore } from "@/lib/gamification/progress";
import { EMPTY_ONBOARDING_STATE, onboardingStore } from "@/lib/onboarding/onboarding";
import { addDaysToIsoDate } from "@/lib/utils/date";

const celebrateGoal = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/lib/feedback/celebrate", () => ({ celebrateGoal }));
vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

const PRO_GOAL = 7;

/** Primer día (10:00 de Lima) cuyas misiones "pro" incluyen todos los tipos pedidos. */
function dateWithKinds(kinds: readonly ActivityKind[]): string {
  let date = "2026-10-11";
  for (let tries = 0; tries < 60; tries += 1) {
    const missions = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: PRO_GOAL, hasRedFlag: false });
    if (kinds.every((kind) => missions.some((mission) => mission.kind === kind))) return date;
    date = addDaysToIsoDate(date, 1);
  }
  throw new Error("Sin fecha con esos tipos de misión");
}

function deferredDose(): DeferredDose {
  return { pendingDoseIds: [], lastConfirmedDoseId: null, take: vi.fn(), undo: vi.fn(), confirm: vi.fn() };
}

function renderToday(date: string) {
  vi.setSystemTime(new Date(`${date}T10:00:00-05:00`));
  onboardingStore.write({ version: 1, startedAt: null, completedAt: `${date}T13:00:00.000Z`, intensity: "pro" });
  return render(<MyDay firstName="Rosa" onOpenBoneTab={vi.fn()} deferredDose={deferredDose()} />);
}

function missionCard(title: string): HTMLElement {
  return screen.getByRole("listitem", { name: title });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  celebrateGoal.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  onboardingStore.write(EMPTY_ONBOARDING_STATE);
  gameProgressStore.write(EMPTY_GAME_PROGRESS);
  pillboxStore.write({ takenDoseIdsByDate: {} });
  painLogStore.write([]);
  patientProfileStore.write(emptyPatientProfile);
});

describe("Hoy con Artiko", () => {
  it("greets with the next mission and shows streak, XP and goal", () => {
    renderToday(dateWithKinds(["self-report"]));
    expect(screen.getByRole("heading", { name: /Buenos días, Rosa/ })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Artiko dice" })).toHaveTextContent(/Tu siguiente misión: ☀️ Chequeo de la mañana/);
    expect(screen.getByRole("img", { name: `Meta de hoy: 0 de ${PRO_GOAL} misiones` })).toBeInTheDocument();
    expect(screen.getByText("Sin densitometría registrada")).toBeInTheDocument();
  });

  it("offers one big next-step button for the first pending mission", async () => {
    const date = dateWithKinds(["self-report"]);
    renderToday(date);
    const missions = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: PRO_GOAL, hasRedFlag: false });
    const next = screen.getByRole("button", { name: /^Siguiente paso: / });
    expect(next).toHaveTextContent(missions[0].title);
    expect(screen.getByText("Tu siguiente paso")).toBeInTheDocument();
  });

  it("completes a self-report mission once, with XP and undo", () => {
    const date = dateWithKinds(["self-report"]);
    renderToday(date);
    const mission = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: PRO_GOAL, hasRedFlag: false }).find((item) => item.kind === "self-report")!;
    fireEvent.click(within(missionCard(mission.title)).getByRole("button", { name: "¡Lo hice!" }));
    expect(within(missionCard(mission.title)).getByText("¡Hecho!")).toBeInTheDocument();
    expect(screen.getByText(`${mission.title}: sumaste ${mission.xp} XP.`)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: `Meta de hoy: 1 de ${PRO_GOAL} misiones` })).toBeInTheDocument();

    fireEvent.click(within(missionCard(mission.title)).getByRole("button", { name: "Deshacer" }));
    expect(screen.getByRole("img", { name: `Meta de hoy: 0 de ${PRO_GOAL} misiones` })).toBeInTheDocument();
  });

  it("guides a physical activity with its disclaimer and completes it", () => {
    const date = dateWithKinds(["guided"]);
    renderToday(date);
    const mission = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: PRO_GOAL, hasRedFlag: false }).find((item) => item.kind === "guided")!;
    fireEvent.click(within(missionCard(mission.title)).getByRole("button", { name: "Empezar" }));
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).getByRole("note")).toHaveTextContent("Si sientes dolor, mareo o algo inusual, detente y consulta a tu médico.");
    fireEvent.click(within(sheet).getByRole("button", { name: "Terminé ✅" }));
    expect(within(missionCard(mission.title)).getByText("¡Hecho!")).toBeInTheDocument();
  });

  it("answers a micro-lesson and always earns the mission", () => {
    const date = dateWithKinds(["quiz"]);
    renderToday(date);
    const mission = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: PRO_GOAL, hasRedFlag: false }).find((item) => item.kind === "quiz")!;
    fireEvent.click(within(missionCard(mission.title)).getByRole("button", { name: "Responder" }));
    const sheet = screen.getByRole("dialog");
    const wrong = mission.quiz!.options.find((_, index) => index !== mission.quiz!.answerIndex)!;
    fireEvent.click(within(sheet).getByRole("button", { name: wrong }));
    expect(within(sheet).getByText(mission.quiz!.explanation)).toBeInTheDocument();
    fireEvent.click(within(sheet).getByRole("button", { name: /Listo, sumar/ }));
    expect(within(missionCard(mission.title)).getByText("¡Hecho!")).toBeInTheDocument();
  });

  it("hides physical activities and puts the rheumatologist first with a red flag", () => {
    patientProfileStore.write({ ...emptyPatientProfile, name: "Rosa", age: 66, sex: "femenino", hasFractureHistory: true, menopausalStatus: "posmenopausica" });
    renderToday(dateWithKinds(["guided"]));
    expect(screen.getByRole("status", { name: "Artiko dice" })).toHaveTextContent(/reumatólogo/);
    const physicalTitles = ACTIVITY_CATALOG.filter((item) => item.safety === "physical").map((item) => item.title);
    physicalTitles.forEach((title) => expect(screen.queryByRole("listitem", { name: title })).toBeNull());
  });

  it("celebrates with confetti once when the daily goal is met", async () => {
    const date = dateWithKinds(["self-report"]);
    pillboxStore.write({ takenDoseIdsByDate: { [date]: ["morning-collagen", "night-magnesium"] } });
    painLogStore.write([{ date, painLevel: 3, stiffness: "0-15" }]);
    const others = selectDailyMissions({ catalog: ACTIVITY_CATALOG, date, goal: PRO_GOAL, hasRedFlag: false })
      .filter((item) => !item.core)
      .map((item) => item.id);
    gameProgressStore.write({ ...EMPTY_GAME_PROGRESS, completions: { [date]: others } });
    renderToday(date);
    await act(async () => undefined);
    expect(screen.getByText(/¡Meta cumplida!/)).toBeInTheDocument();
    expect(celebrateGoal).toHaveBeenCalledTimes(1);
    expect(JSON.parse(window.localStorage.getItem("artikare_game_v1") ?? "{}").celebratedKeys).toContain(`goal:${date}`);
  });
});
