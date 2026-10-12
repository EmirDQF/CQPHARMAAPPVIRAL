/** @vitest-environment jsdom */
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), pathname: "/", native: true }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), usePathname: () => mocks.pathname }));
vi.mock("@/lib/native/doseNotifications", () => ({ isNativeApp: () => mocks.native }));

import { NativeLaunchRedirect } from "./NativeLaunchRedirect";

beforeEach(() => {
  mocks.replace.mockClear();
  mocks.pathname = "/";
  mocks.native = true;
  window.sessionStorage.clear();
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("NativeLaunchRedirect", () => {
  it("abre la app en /app la primera vez", () => {
    render(<NativeLaunchRedirect />);
    expect(mocks.replace).toHaveBeenCalledWith("/app");
  });

  it("solo una vez por sesión: volver al inicio desde la app no rebota", () => {
    render(<NativeLaunchRedirect />).unmount();
    render(<NativeLaunchRedirect />);
    expect(mocks.replace).toHaveBeenCalledTimes(1);
  });

  it("no toca la web, otras rutas ni un enlace con query", () => {
    mocks.native = false;
    render(<NativeLaunchRedirect />).unmount();
    mocks.native = true;
    mocks.pathname = "/blog";
    render(<NativeLaunchRedirect />).unmount();
    mocks.pathname = "/";
    window.history.replaceState(null, "", "/?utm_source=whatsapp");
    render(<NativeLaunchRedirect />);
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
