// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { emptyPatientProfile, patientProfileStore } from "@/lib/dashboard/patientProfile";
import { PatientProfileLauncher } from "./PatientProfileLauncher";

afterEach(() => {
  cleanup();
  patientProfileStore.write(emptyPatientProfile);
});

describe("PatientProfileLauncher", () => {
  it("loads the stored answers when the form opens, so saving never erases them", () => {
    render(<PatientProfileLauncher />);
    // Simula la hidratación: el perfil guardado llega después del primer render.
    act(() => {
      patientProfileStore.write({
        ...emptyPatientProfile,
        age: 63,
        sex: "femenino",
        menopausalStatus: "posmenopausica",
        hasFractureHistory: true,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar mi perfil médico" }));

    expect(screen.getByRole("radio", { name: "Sí" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Posmenopáusica" })).toBeChecked();
    expect(screen.getByLabelText("Edad")).toHaveValue("63");
  });

  it("closes with Escape", () => {
    render(<PatientProfileLauncher />);
    fireEvent.click(screen.getByRole("button", { name: "Editar mi perfil médico" }));
    const dialog = screen.getByRole("dialog", { name: "Mi Perfil Médico" });

    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
