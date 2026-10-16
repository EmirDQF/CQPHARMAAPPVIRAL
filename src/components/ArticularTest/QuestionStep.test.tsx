/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { scoredQuestions } from "@/lib/questions";
import { QuestionStep } from "./QuestionStep";

const playSound = vi.fn();
vi.mock("@/lib/feedback/sounds", () => ({ playSound: (name: string) => playSound(name) }));

describe("QuestionStep", () => {
  it("answers with a soft tap sound after the person's own tap", () => {
    const onSelect = vi.fn();
    const question = scoredQuestions[0];
    render(<QuestionStep question={question} selectedValue={undefined} onSelect={onSelect} />);
    expect(playSound).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio", { name: question.options[0].label }));

    expect(playSound).toHaveBeenCalledWith("tap");
    expect(onSelect).toHaveBeenCalledWith(question.options[0].value);
  });
});
