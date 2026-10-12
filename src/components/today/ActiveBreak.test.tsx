/** @vitest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SmartRemindersSection } from "@/components/settings/SmartRemindersSection";
import { ACTIVE_BREAK_AFTER_MS } from "@/hooks/useActiveBreak";
import { DEFAULT_SMART_REMINDERS, smartRemindersStore } from "@/lib/reminders/smart/settings";
import { toLimaIsoDate } from "@/lib/utils/date";
import { ActiveBreak } from "./ActiveBreak";

vi.mock("@/lib/feedback/haptics", () => ({ triggerHaptic: vi.fn(async () => undefined) }));

afterEach(() => {
  vi.useRealTimers();
  smartRemindersStore.write(DEFAULT_SMART_REMINDERS);
});

describe("ActiveBreak", () => {
  it("stays hidden while the trigger is off (opt-in)", () => {
    vi.useFakeTimers();
    render(<ActiveBreak />);
    act(() => vi.advanceTimersByTime(ACTIVE_BREAK_AFTER_MS + 60_000));
    expect(screen.queryByRole("region", { name: "Pausa activa" })).toBeNull();
  });

  it("offers a 1-minute break after ~10 minutes on screen, with a visible 'Ahora no'", () => {
    vi.useFakeTimers();
    smartRemindersStore.write({ ...DEFAULT_SMART_REMINDERS, activeBreaks: true });
    render(<ActiveBreak />);
    act(() => vi.advanceTimersByTime(ACTIVE_BREAK_AFTER_MS - 60_000));
    expect(screen.queryByRole("region", { name: "Pausa activa" })).toBeNull();
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("region", { name: "Pausa activa" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ahora no" }));
    expect(screen.queryByRole("region", { name: "Pausa activa" })).toBeNull();
  });

  it("opens the guided 1-minute break", () => {
    vi.useFakeTimers();
    smartRemindersStore.write({ ...DEFAULT_SMART_REMINDERS, activeBreaks: true });
    render(<ActiveBreak />);
    act(() => vi.advanceTimersByTime(ACTIVE_BREAK_AFTER_MS + 30_000));
    fireEvent.click(screen.getByRole("button", { name: "¡Vamos!" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Pausa de 1 minuto");
  });
});

describe("SmartRemindersSection", () => {
  it("turns each trigger on and off and silences today", () => {
    render(<SmartRemindersSection />);
    fireEvent.click(screen.getByRole("switch", { name: /Aviso al conectarte a Wi-Fi/ }));
    fireEvent.click(screen.getByRole("switch", { name: /Pausa activa/ }));
    expect(smartRemindersStore.getSnapshot()).toMatchObject({ wifiNudges: true, activeBreaks: true });

    fireEvent.click(screen.getByRole("button", { name: /Silenciar hoy/ }));
    expect(smartRemindersStore.getSnapshot().silencedOn).toBe(toLimaIsoDate());
    fireEvent.click(screen.getByRole("button", { name: /Volver a activar hoy/ }));
    expect(smartRemindersStore.getSnapshot().silencedOn).toBeNull();
  });

  it("reads the real notification permission", () => {
    render(<SmartRemindersSection />);
    expect(screen.getByText(/permiso de avisos|bloqueados|Avisos permitidos|iPhone/)).toBeInTheDocument();
  });
});
