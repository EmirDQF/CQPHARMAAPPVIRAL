// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * capacitor-shell-src/offline.js es HTML estático del WebView (sin bundler ni
 * plugins): se carga como texto y se evalúa con dependencias simuladas.
 */
interface ShellApi {
  resolveAppUrl(config: unknown): string | null;
  describeFailure(isOnline: boolean): string;
  start(win: FakeWindow, doc: Document): void;
}

interface FakeWindow {
  ARTIKARE_SHELL_CONFIG?: unknown;
  navigator: { onLine: boolean };
  location: { replace: (url: string) => void; reload: () => void };
  addEventListener: (type: string, listener: () => void) => void;
}

const SOURCE = readFileSync(join(process.cwd(), "capacitor-shell-src", "offline.js"), "utf8");

function loadShell(): ShellApi {
  const shellModule = { exports: {} as ShellApi };
  new Function("module", SOURCE)(shellModule);
  return shellModule.exports;
}

function fakeWindow(overrides: Partial<FakeWindow> = {}) {
  const listeners = new Map<string, () => void>();
  const win: FakeWindow = {
    navigator: { onLine: false },
    location: { replace: vi.fn(), reload: vi.fn() },
    addEventListener: (type, listener) => listeners.set(type, listener),
    ...overrides,
  };
  return { win, fire: (type: string) => listeners.get(type)?.() };
}

beforeEach(() => {
  document.body.innerHTML = `<p id="estado" role="status"></p><button id="reintentar" type="button">Reintentar</button>`;
});

describe("offline shell", () => {
  it("accepts only an https app URL without credentials", () => {
    const shell = loadShell();

    expect(shell.resolveAppUrl({ appUrl: "https://artikare.com" })).toBe("https://artikare.com/");
    expect(shell.resolveAppUrl({ appUrl: "http://artikare.com" })).toBeNull();
    expect(shell.resolveAppUrl({ appUrl: "https://user:pass@artikare.com" })).toBeNull();
    expect(shell.resolveAppUrl({ appUrl: "javascript:alert(1)" })).toBeNull();
    expect(shell.resolveAppUrl(undefined)).toBeNull();
  });

  it("accepts http only to the loopback hosts the debug variant allows", () => {
    const shell = loadShell();

    expect(shell.resolveAppUrl({ appUrl: "http://localhost:3000" })).toBe("http://localhost:3000/");
    expect(shell.resolveAppUrl({ appUrl: "http://127.0.0.1:3000" })).toBe("http://127.0.0.1:3000/");
    expect(shell.resolveAppUrl({ appUrl: "http://192.168.1.20:3000" })).toBeNull();
    expect(shell.resolveAppUrl({ appUrl: "http://localhost.evil.com" })).toBeNull();
  });

  it("explains whether the phone is offline or the server is not answering", () => {
    const shell = loadShell();

    expect(shell.describeFailure(false)).toMatch(/sin conexión a internet/i);
    expect(shell.describeFailure(true)).toMatch(/no responde/i);
    // Los recordatorios son notificaciones locales: el mensaje lo recuerda sin datos de salud.
    expect(shell.describeFailure(false)).toMatch(/recordatorios/i);
  });

  it("returns to the remote app when the patient taps Reintentar", () => {
    const shell = loadShell();
    const { win } = fakeWindow({ ARTIKARE_SHELL_CONFIG: { appUrl: "https://artikare.com" } });

    shell.start(win, document);
    document.getElementById("reintentar")?.click();

    expect(win.location.replace).toHaveBeenCalledWith("https://artikare.com/");
    expect(document.getElementById("estado")?.textContent).toMatch(/sin conexión/i);
  });

  it("retries automatically once the connection comes back, only once", () => {
    const shell = loadShell();
    const { win, fire } = fakeWindow({ ARTIKARE_SHELL_CONFIG: { appUrl: "https://artikare.com" } });

    shell.start(win, document);
    fire("online");
    fire("online");

    expect(win.location.replace).toHaveBeenCalledTimes(1);
  });

  it("reloads in place when no valid app URL was configured", () => {
    const shell = loadShell();
    const { win } = fakeWindow({ navigator: { onLine: true } });

    shell.start(win, document);
    document.getElementById("reintentar")?.click();

    expect(win.location.reload).toHaveBeenCalledTimes(1);
    expect(win.location.replace).not.toHaveBeenCalled();
    expect(document.getElementById("estado")?.textContent).toMatch(/no responde/i);
  });
});
