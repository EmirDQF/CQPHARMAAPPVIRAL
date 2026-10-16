/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_FEEDBACK_PREFERENCES, feedbackPreferencesStore } from "@/lib/feedback/preferences";
import { SoundToggle } from "./SoundToggle";

const playSound = vi.fn();
vi.mock("@/lib/feedback/sounds", () => ({ playSound: (name: string) => playSound(name) }));

afterEach(() => {
  feedbackPreferencesStore.write(DEFAULT_FEEDBACK_PREFERENCES);
  window.localStorage.clear();
  playSound.mockClear();
});

describe("SoundToggle", () => {
  it("mutes and persists the same 'Sonidos' preference used in Ajustes", () => {
    render(<SoundToggle />);
    const toggle = screen.getByRole("button", { name: "Sonidos" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(feedbackPreferencesStore.getSnapshot().sound).toBe(false);
    expect(JSON.parse(window.localStorage.getItem("artikare_feedback_prefs_v1") ?? "{}")).toMatchObject({ sound: false });
    expect(playSound).not.toHaveBeenCalled();
  });

  it("confirms with a tap when turning sound back on", () => {
    feedbackPreferencesStore.write({ ...DEFAULT_FEEDBACK_PREFERENCES, sound: false });
    render(<SoundToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Sonidos" }));
    expect(playSound).toHaveBeenCalledWith("tap");
  });
});
