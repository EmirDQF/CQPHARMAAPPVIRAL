/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { TEXT_SIZE_STORAGE_KEY } from "./textSize";
import { TEXT_SIZE_BOOT_SCRIPT } from "./textSizeBootScript";

function runBootScript() {
  new Function(TEXT_SIZE_BOOT_SCRIPT)();
}

describe("TEXT_SIZE_BOOT_SCRIPT", () => {
  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.textSize;
  });

  it("aplica el tamaño guardado antes de hidratar", () => {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, JSON.stringify({ version: 1, size: "xlarge" }));
    runBootScript();
    expect(document.documentElement.dataset.textSize).toBe("xlarge");
  });

  it("no toca <html> si no hay preferencia guardada", () => {
    runBootScript();
    expect(document.documentElement.dataset.textSize).toBeUndefined();
  });

  it("ignora tamaños desconocidos, versiones futuras y JSON corrupto", () => {
    for (const raw of [
      JSON.stringify({ version: 1, size: "gigante" }),
      JSON.stringify({ version: 2, size: "large" }),
      "{no-json",
    ]) {
      window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, raw);
      expect(runBootScript).not.toThrow();
      expect(document.documentElement.dataset.textSize).toBeUndefined();
    }
  });
});
