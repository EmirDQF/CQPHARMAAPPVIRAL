// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NativePermissionState } from "@/lib/native/doseNotifications";

const native = vi.hoisted(() => ({
  isNativeApp: vi.fn(() => true),
  syncNativeDoseReminders: vi.fn<() => Promise<NativePermissionState>>(),
  enableNativeDoseReminders: vi.fn(async () => "granted" as const),
}));
vi.mock("@/lib/native/doseNotifications", () => native);

/** El hook guarda el último permiso nativo a nivel de módulo: cada test parte de cero. */
async function loadHook() {
  vi.resetModules();
  const [{ usePillboxReminders }, { pillboxStore }, { toLimaIsoDate }] = await Promise.all([
    import("./usePillboxReminders"),
    import("@/lib/dashboard/pillbox"),
    import("@/lib/utils/date"),
  ]);
  // La oferta solo aparece después de la primera toma.
  pillboxStore.write({ takenDoseIdsByDate: { [toLimaIsoDate()]: ["morning-collagen"] } });
  return usePillboxReminders;
}

beforeEach(() => {
  vi.clearAllMocks();
  native.isNativeApp.mockReturnValue(true);
});

afterEach(() => {
  window.localStorage.clear();
});

describe("usePillboxReminders en la app nativa", () => {
  it("no vuelve a ofrecer los recordatorios si el sistema ya los permite, y los reprograma", async () => {
    native.syncNativeDoseReminders.mockResolvedValue("granted");
    const usePillboxReminders = await loadHook();

    const { result } = renderHook(() => usePillboxReminders());

    await waitFor(() => expect(result.current.support).toBe("granted"));
    expect(result.current.shouldOffer).toBe(false);
    expect(native.syncNativeDoseReminders).toHaveBeenCalledTimes(1);
  });

  it("ofrece los recordatorios mientras el paciente no haya decidido", async () => {
    native.syncNativeDoseReminders.mockResolvedValue("prompt");
    const usePillboxReminders = await loadHook();

    const { result } = renderHook(() => usePillboxReminders());

    await waitFor(() => expect(native.syncNativeDoseReminders).toHaveBeenCalled());
    expect(result.current.support).toBe("ask");
    expect(result.current.shouldOffer).toBe(true);
  });

  it("con el permiso denegado en el sistema ofrece la alternativa del calendario", async () => {
    native.syncNativeDoseReminders.mockResolvedValue("denied");
    const usePillboxReminders = await loadHook();

    const { result } = renderHook(() => usePillboxReminders());

    await waitFor(() => expect(result.current.support).toBe("calendar"));
  });

  it("en la web no consulta el plugin nativo", async () => {
    native.isNativeApp.mockReturnValue(false);
    const usePillboxReminders = await loadHook();

    renderHook(() => usePillboxReminders());

    expect(native.syncNativeDoseReminders).not.toHaveBeenCalled();
  });
});
