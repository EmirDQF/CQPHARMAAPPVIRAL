/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEME_BOOT_SCRIPT, THEME_STORAGE_KEY, parseTheme } from "./theme";

describe("parseTheme", () => {
  it("claro por defecto y oscuro solo si se eligió", () => {
    expect(DEFAULT_THEME.mode).toBe("light");
    expect(parseTheme({ version: 1, mode: "dark" })).toEqual({ version: 1, mode: "dark" });
    expect(parseTheme({ version: 1, mode: "sepia" })).toEqual(DEFAULT_THEME);
    expect(parseTheme({ version: 2, mode: "dark" })).toBeNull();
  });
});

describe("THEME_BOOT_SCRIPT", () => {
  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("aplica el oscuro guardado antes de hidratar", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ version: 1, mode: "dark" }));
    new Function(THEME_BOOT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("sin preferencia, o con algo inválido, se queda en claro", () => {
    new Function(THEME_BOOT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
    window.localStorage.setItem(THEME_STORAGE_KEY, "{roto");
    new Function(THEME_BOOT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
