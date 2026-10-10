// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildPersonalDataExport,
  clearLocalPersonalData,
  consumeLocalDeletionDone,
  markLocalDeletionDone,
  personalDataExportFileName,
  readLocalPersonalData,
} from "./arco";
import { CONSENT_VERSION } from "./consent";

const NOW = new Date("2026-10-10T15:00:00.000Z");

beforeEach(() => {
  window.localStorage.clear();
});

describe("readLocalPersonalData", () => {
  it("traduce cada clave de Artikare a una sección legible", () => {
    window.localStorage.setItem("artikare_pain_log_v1", JSON.stringify([{ date: "2026-10-01", painLevel: 3 }]));
    window.localStorage.setItem("artikare_patient_profile_v1", JSON.stringify({ age: 60 }));

    expect(readLocalPersonalData(window.localStorage)).toEqual({
      diarioDeDolorYRigidez: [{ date: "2026-10-01", painLevel: 3 }],
      perfilMedico: { age: 60 },
    });
  });

  it("incluye las claves sin traducción bajo su propio nombre y respeta el texto no JSON", () => {
    window.localStorage.setItem("artikare_nueva_clave_v9", "texto-plano");

    expect(readLocalPersonalData(window.localStorage)).toEqual({ artikare_nueva_clave_v9: "texto-plano" });
  });

  it("ignora lo que no es de Artikare", () => {
    window.localStorage.setItem("otra_app", "x");

    expect(readLocalPersonalData(window.localStorage)).toEqual({});
  });
});

describe("buildPersonalDataExport", () => {
  it("lleva la fecha, la versión de la política y lo de la cuenta cuando existe", () => {
    const exported = buildPersonalDataExport({ local: { perfilMedico: { age: 60 } }, account: { citas: [] }, now: NOW });

    expect(exported).toEqual({
      formato: "artikare-mis-datos-v1",
      generadoEl: "2026-10-10T15:00:00.000Z",
      versionDePolitica: CONSENT_VERSION,
      aviso: expect.stringContaining("no reemplaza"),
      enEsteCelular: { perfilMedico: { age: 60 } },
      enTuCuenta: { citas: [] },
    });
  });

  it("sin cuenta deja enTuCuenta en null", () => {
    expect(buildPersonalDataExport({ local: {}, account: null, now: NOW }).enTuCuenta).toBeNull();
  });
});

describe("personalDataExportFileName", () => {
  it("usa la fecha de Lima y no incluye datos personales", () => {
    expect(personalDataExportFileName(new Date("2026-10-11T03:00:00.000Z"))).toBe("artikare-mis-datos-2026-10-10.json");
  });
});

describe("marca de borrado hecho", () => {
  it("se lee una sola vez y no queda en localStorage", () => {
    markLocalDeletionDone(window.sessionStorage);
    clearLocalPersonalData(window.localStorage);

    expect(consumeLocalDeletionDone(window.sessionStorage)).toBe(true);
    expect(consumeLocalDeletionDone(window.sessionStorage)).toBe(false);
    expect(window.localStorage.length).toBe(0);
  });
});

describe("clearLocalPersonalData", () => {
  it("borra todas las claves de Artikare y nada más", () => {
    window.localStorage.setItem("artikare_pain_log_v1", "[]");
    window.localStorage.setItem("artikare_pillbox_v1", "{}");
    window.localStorage.setItem("otra_app", "x");

    expect(clearLocalPersonalData(window.localStorage)).toBe(2);

    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.getItem("otra_app")).toBe("x");
  });
});
