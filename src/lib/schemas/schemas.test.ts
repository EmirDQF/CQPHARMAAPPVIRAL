import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appointmentCancelSchema, appointmentRowSchema } from "./appointment";
import { assessmentInsertSchema } from "./assessment";
import { bottleInsertSchema } from "./bottle";
import { consentInsertSchema } from "./consent";
import { dexaScanInsertSchema } from "./dexaScan";
import { doseEventInsertSchema } from "./doseEvent";
import { painLogInsertSchema } from "./painLog";
import { productRowSchema } from "./product";
import { profileUpsertSchema } from "./profile";

// 2026-09-25 20:00 en Lima = 2026-09-26 01:00 UTC: en UTC ya es "mañana".
const LIMA_EVENING = new Date("2026-09-26T01:00:00Z");
const LIMA_TODAY = "2026-09-25";
const LIMA_TOMORROW = "2026-09-26";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(LIMA_EVENING);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("dexaScanInsertSchema", () => {
  const valid = { scan_date: LIMA_TODAY, lumbar_t: -2.5, femoral_t: -1.6, radiology_center: "" };

  it("acepta los extremos -6.0 y +4.0", () => {
    expect(dexaScanInsertSchema.safeParse({ ...valid, lumbar_t: -6, femoral_t: 4 }).success).toBe(
      true
    );
  });

  it("rechaza T-score fuera de rango (-6.1 y 4.1)", () => {
    expect(dexaScanInsertSchema.safeParse({ ...valid, lumbar_t: -6.1 }).success).toBe(false);
    expect(dexaScanInsertSchema.safeParse({ ...valid, femoral_t: 4.1 }).success).toBe(false);
  });

  it("rechaza más de 2 decimales en vez de redondear a través de un umbral OMS", () => {
    expect(dexaScanInsertSchema.safeParse({ ...valid, lumbar_t: -1.004 }).success).toBe(false);
    expect(dexaScanInsertSchema.safeParse({ ...valid, femoral_t: -2.495 }).success).toBe(false);
    expect(dexaScanInsertSchema.safeParse({ ...valid, lumbar_t: -1.01 }).success).toBe(true);
  });

  it("rechaza una fecha futura según el día de Lima, aunque en UTC ya sea ese día", () => {
    expect(dexaScanInsertSchema.safeParse({ ...valid, scan_date: LIMA_TOMORROW }).success).toBe(
      false
    );
  });
});

describe("painLogInsertSchema", () => {
  const valid = { log_date: LIMA_TODAY, pain_level: 4, stiffness: "15-30" };

  it("acepta 0 y 10", () => {
    expect(painLogInsertSchema.safeParse({ ...valid, pain_level: 0 }).success).toBe(true);
    expect(painLogInsertSchema.safeParse({ ...valid, pain_level: 10 }).success).toBe(true);
  });

  it("rechaza dolor 11, -1 y decimales", () => {
    for (const pain_level of [11, -1, 4.5]) {
      expect(painLogInsertSchema.safeParse({ ...valid, pain_level }).success).toBe(false);
    }
  });

  it("rechaza rigidez desconocida y fecha futura", () => {
    expect(painLogInsertSchema.safeParse({ ...valid, stiffness: "60+" }).success).toBe(false);
    expect(painLogInsertSchema.safeParse({ ...valid, log_date: LIMA_TOMORROW }).success).toBe(
      false
    );
  });
});

describe("profileUpsertSchema", () => {
  const valid = {
    name: "Rosa",
    age: 58,
    sex: "femenino",
    menopausal_status: "posmenopausica",
    has_fracture_history: null,
    weight_kg: 62.5,
    allergies: "",
    phone: "",
  };

  it("acepta un perfil completo y uno sin responder", () => {
    expect(profileUpsertSchema.safeParse(valid).success).toBe(true);
    expect(
      profileUpsertSchema.safeParse({
        ...valid,
        age: null,
        sex: null,
        menopausal_status: null,
        weight_kg: null,
      }).success
    ).toBe(true);
  });

  it("rechaza edad 0 o 120 y peso no positivo", () => {
    expect(profileUpsertSchema.safeParse({ ...valid, age: 0 }).success).toBe(false);
    expect(profileUpsertSchema.safeParse({ ...valid, age: 120 }).success).toBe(false);
    expect(profileUpsertSchema.safeParse({ ...valid, weight_kg: 0 }).success).toBe(false);
  });
});

describe("assessmentInsertSchema", () => {
  const valid = {
    chronological_age: 52,
    articular_age: 63,
    risk_level: "moderado",
    answers: { rigidez: "mas-15", crujido: "si" },
  };

  it("acepta un resultado del test", () => {
    expect(assessmentInsertSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza edad articular > 129 y respuestas que no son texto", () => {
    expect(assessmentInsertSchema.safeParse({ ...valid, articular_age: 130 }).success).toBe(false);
    expect(assessmentInsertSchema.safeParse({ ...valid, answers: { rigidez: 3 } }).success).toBe(
      false
    );
  });
});

describe("consentInsertSchema", () => {
  it("exige propósito conocido y versión de política", () => {
    const valid = {
      purpose: "perfil-clinico",
      policy_version: "2026-09-24-provisional",
      granted_at: "2026-09-25T15:00:00.000Z",
      revoked_at: null,
    };
    expect(consentInsertSchema.safeParse(valid).success).toBe(true);
    expect(consentInsertSchema.safeParse({ ...valid, purpose: "marketing" }).success).toBe(false);
    expect(consentInsertSchema.safeParse({ ...valid, policy_version: "" }).success).toBe(false);
  });
});

describe("doseEventInsertSchema y bottleInsertSchema", () => {
  it("solo aceptan tomas del horario y fechas no futuras", () => {
    const dose = {
      dose_id: "morning-collagen",
      product_id: "colageno-vitamina-c",
      taken_on: LIMA_TODAY,
      taken_at: "2026-09-25T13:30:00.000Z",
    };
    expect(doseEventInsertSchema.safeParse(dose).success).toBe(true);
    expect(doseEventInsertSchema.safeParse({ ...dose, dose_id: "noon-extra" }).success).toBe(false);
    expect(doseEventInsertSchema.safeParse({ ...dose, taken_on: LIMA_TOMORROW }).success).toBe(
      false
    );

    const bottle = { product_id: "citrato-magnesio-d3", started_on: LIMA_TODAY };
    expect(bottleInsertSchema.safeParse(bottle).success).toBe(true);
    expect(bottleInsertSchema.safeParse({ ...bottle, started_on: LIMA_TOMORROW }).success).toBe(
      false
    );
  });
});

describe("productRowSchema", () => {
  const draft = {
    id: "colageno-vitamina-c",
    name: "Colágeno Hidrolizado + Vitamina C",
    composition: ["Colágeno hidrolizado", "Vitamina C"],
    digemid_registration: null,
    presentation: null,
    doses_per_bottle: 60,
    price_pen: null,
    active: false,
  };

  it("acepta un producto inactivo sin datos regulatorios", () => {
    expect(productRowSchema.safeParse(draft).success).toBe(true);
  });

  it("no permite un producto activo sin registro DIGEMID, presentación o precio", () => {
    expect(productRowSchema.safeParse({ ...draft, active: true }).success).toBe(false);
    expect(
      productRowSchema.safeParse({
        ...draft,
        active: true,
        digemid_registration: "N-12345",
        presentation: "Frasco x 60",
        price_pen: 89.9,
      }).success
    ).toBe(true);
  });
});

describe("appointment", () => {
  const row = {
    id: "3f1c2b8e-9a0d-4c1e-8f5a-2b7c9d0e1f23",
    user_id: "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d",
    code: "ART-ABC234",
    service_id: "densitometria",
    appointment_date: "2026-10-02",
    slot: "manana",
    patient_name: "Rosa",
    patient_age: 58,
    patient_phone: "987654321",
    booked_by: "hijo",
    status: "solicitada",
    consent_version: "2026-09-24-provisional",
    consent_at: "2026-09-25T15:00:00+00:00",
    created_at: "2026-09-25T15:00:00.123456+00:00",
    updated_at: "2026-09-25T15:00:00.123456+00:00",
  };

  it("valida la fila leída de Supabase", () => {
    expect(appointmentRowSchema.safeParse(row).success).toBe(true);
    expect(appointmentRowSchema.safeParse({ ...row, code: "ART-ABC1O0" }).success).toBe(false);
  });

  it("el paciente solo puede cambiar el estado a cancelada", () => {
    expect(appointmentCancelSchema.safeParse({ status: "cancelada" }).success).toBe(true);
    expect(appointmentCancelSchema.safeParse({ status: "confirmada" }).success).toBe(false);
  });
});
