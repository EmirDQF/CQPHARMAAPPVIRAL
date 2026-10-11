// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { findForbiddenPhrases } from "@/lib/clinical/forbiddenCopy";
import { REWARD_CATALOG } from "@/lib/rewards/catalog";
import { computeHabitStats } from "@/lib/rewards/rules";
import { EMPTY_REWARD_PROGRESS } from "@/lib/rewards/schemas";
import { AchievementsShowcase } from "./AchievementsShowcase";
import { RewardCelebration } from "./RewardCelebration";

const emptyStats = computeHabitStats({ takenDoseIdsByDate: {} }, [], new Date("2026-10-11T12:00:00-05:00"));

describe("RewardCelebration", () => {
  it("announces the new reward politely and lets the patient move on", () => {
    const onDismiss = vi.fn();
    const onOpen = vi.fn();
    const [first, second] = REWARD_CATALOG;
    const { container } = render(
      <RewardCelebration
        celebrations={[{ key: first.id, reward: first }, { key: second.id, reward: second }]}
        onDismiss={onDismiss}
        onOpenAchievements={onOpen}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(first.title);
    expect(screen.getByText("Y 1 logro más.")).toBeInTheDocument();
    expect(findForbiddenPhrases(container.textContent ?? "")).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Ver mis logros" }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("renders nothing without new rewards", () => {
    const { container } = render(<RewardCelebration celebrations={[]} onDismiss={vi.fn()} onOpenAchievements={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("AchievementsShowcase", () => {
  it("shows a kind empty state and the next goals with their progress", () => {
    const { container } = render(
      <AchievementsShowcase rewards={{ catalog: REWARD_CATALOG, stats: emptyStats, progress: EMPTY_REWARD_PROGRESS }} />
    );
    expect(screen.getByText(/Tu primer logro llega/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Próximas metas" })).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
    expect(findForbiddenPhrases(container.textContent ?? "")).toEqual([]);
  });

  it("lists earned rewards, which never disappear", () => {
    const progress = { ...EMPTY_REWARD_PROGRESS, unlocked: [{ rewardId: "primer-dia", key: "primer-dia", unlockedOn: "2026-10-01" }] };
    render(<AchievementsShowcase rewards={{ catalog: REWARD_CATALOG, stats: emptyStats, progress }} />);
    expect(screen.getByText("Primer día completo")).toBeInTheDocument();
  });
});
