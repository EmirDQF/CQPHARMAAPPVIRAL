/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { feedbackPreferencesStore } from "@/lib/feedback/preferences";
import { FeedbackPreferencesSection } from "./FeedbackPreferencesSection";

describe("FeedbackPreferencesSection", () => {
  it("turns vibration off and on, saving it at once", () => {
    render(<FeedbackPreferencesSection />);
    const vibration = screen.getByRole("switch", { name: /Vibración al tocar/ });
    expect(vibration).toBeChecked();

    fireEvent.click(vibration);
    expect(feedbackPreferencesStore.getSnapshot().haptics).toBe(false);
    expect(JSON.parse(window.localStorage.getItem("artikare_feedback_prefs_v1") ?? "{}")).toMatchObject({ haptics: false });

    fireEvent.click(vibration);
    expect(feedbackPreferencesStore.getSnapshot().haptics).toBe(true);
  });

  it("lets the person turn celebrations off", () => {
    render(<FeedbackPreferencesSection />);
    fireEvent.click(screen.getByRole("switch", { name: /Confeti y celebraciones/ }));
    expect(feedbackPreferencesStore.getSnapshot().celebrations).toBe(false);
  });
});
