// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickActions } from "./QuickActions";

describe("QuickActions", () => {
  it("opens an accessible sheet to log a pending dose and closes it after logging", () => {
    const onTake = vi.fn();
    render(<QuickActions doneOrPendingDoseIds={["morning-collagen"]} onTake={onTake} />);

    fireEvent.click(screen.getByRole("button", { name: /Anotar toma/ }));
    const sheet = screen.getByRole("dialog", { name: "Anotar toma" });
    expect(sheet).toBeInTheDocument();
    // Solo la franja pendiente: una toma ya anotada no se puede volver a sumar.
    expect(screen.getAllByRole("button", { name: "Ya me la tomé" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Ya me la tomé" }));
    expect(onTake).toHaveBeenCalledWith("night-magnesium");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says so kindly when every dose is already logged", () => {
    render(<QuickActions doneOrPendingDoseIds={["morning-collagen", "night-magnesium"]} onTake={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Anotar toma/ }));
    expect(screen.getByText("Ya anotaste todas tus tomas de hoy.")).toBeInTheDocument();
  });

  it("opens the pain check-in in a sheet with a close button", () => {
    render(<QuickActions doneOrPendingDoseIds={[]} onTake={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Chequeo de dolor/ }));
    expect(screen.getByRole("dialog", { name: "Chequeo de hoy" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
