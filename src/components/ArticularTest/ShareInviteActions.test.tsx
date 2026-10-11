// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findForbiddenPhrases } from "@/lib/clinical/forbiddenCopy";
import { ShareInviteActions } from "./ShareInviteActions";

const native = vi.hoisted(() => ({ isNativeApp: vi.fn(() => false) }));
vi.mock("@/lib/native/doseNotifications", () => native);

const openSpy = vi.fn();

beforeEach(() => {
  vi.stubGlobal("open", openSpy);
  openSpy.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, "share");
});

describe("ShareInviteActions", () => {
  it("shares the family invitation with navigator.share when the browser offers it", async () => {
    const share = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    render(<ShareInviteActions />);

    fireEvent.click(screen.getByRole("button", { name: "Invitar a mamá, papá o un familiar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Gracias por compartir");
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("utm_campaign=derivacion-familiar") })
    );
  });

  it("falls back to WhatsApp without a share sheet and says so", async () => {
    render(<ShareInviteActions />);

    fireEvent.click(screen.getByRole("button", { name: "Compartir el test" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Intentamos abrir WhatsApp");
    expect(openSpy).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/\?text=/), "_blank", "noopener,noreferrer");
  });

  it("tells the patient that only the invitation is shared, with allowed copy", () => {
    const { container } = render(<ShareInviteActions />);

    expect(screen.getByText(/no tu resultado/)).toBeInTheDocument();
    expect(findForbiddenPhrases(container.textContent ?? "")).toEqual([]);
  });
});
