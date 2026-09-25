import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APPOINTMENT_CODE_PATTERN } from "../appointments/generateCode";
import {
  ARTICULAR_AGE_MAX,
  BOTTLE_SERVINGS,
  CLINIC_TIME_ZONE,
  DOSE_SCHEDULE,
  PAIN_LEVEL_MAX,
  PAIN_LEVEL_MIN,
  PATIENT_AGE_MAX,
  PATIENT_AGE_MIN,
  T_SCORE_INPUT_MAX,
  T_SCORE_INPUT_MIN,
} from "../clinical/constants";
import { MENOPAUSAL_STATUSES } from "../clinical/tScoreEligibility";
import {
  APPOINTMENT_SLOTS,
  APPOINTMENT_STATUSES,
  BOOKED_BY,
  CLINICAL_SERVICE_IDS,
  PATIENT_PHONE_PATTERN,
} from "./appointment";
import { RISK_LEVELS } from "./assessment";
import { CONSENT_PURPOSES } from "./consent";
import { STIFFNESS_BUCKETS } from "./painLog";
import { PROFILE_WEIGHT_MAX_KG, SEXES } from "./profile";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

/** Todas las migraciones en orden, sin comentarios, en minúsculas y con espacios colapsados. */
function readMigrationsSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(MIGRATIONS_DIR, file), "utf8"))
    .join("\n")
    .replace(/--.*$/gm, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sqlEnumList(values: readonly string[]): string {
  return values.map((value) => `'${value}'`).join(", ");
}

const sql = readMigrationsSql();
const limaToday = `(now() at time zone '${CLINIC_TIME_ZONE.toLowerCase()}')::date`;

describe("paridad constantes clínicas ↔ SQL", () => {
  it("los T-score aceptan exactamente el rango de T_SCORE_INPUT_MIN/MAX", () => {
    const range = `between ${T_SCORE_INPUT_MIN.toFixed(1)} and ${T_SCORE_INPUT_MAX.toFixed(1)}`;
    expect(sql).toContain(`check (lumbar_t ${range})`);
    expect(sql).toContain(`check (femoral_t ${range})`);
  });

  it("los T-score rechazan un tercer decimal en vez de redondearlo", () => {
    expect(sql).toContain("check (scale(lumbar_t) <= 2)");
    expect(sql).toContain("check (scale(femoral_t) <= 2)");
    expect(sql).not.toMatch(/_t numeric\(/);
  });

  it("el dolor usa PAIN_LEVEL_MIN/MAX", () => {
    expect(sql).toContain(`check (pain_level between ${PAIN_LEVEL_MIN} and ${PAIN_LEVEL_MAX})`);
  });

  it("las edades usan PATIENT_AGE_MIN/MAX y ARTICULAR_AGE_MAX", () => {
    expect(sql).toContain(`check (age between ${PATIENT_AGE_MIN} and ${PATIENT_AGE_MAX})`);
    expect(sql).toContain(
      `check (chronological_age between ${PATIENT_AGE_MIN} and ${PATIENT_AGE_MAX})`
    );
    expect(sql).toContain(
      `check (articular_age between ${PATIENT_AGE_MIN} and ${ARTICULAR_AGE_MAX})`
    );
    expect(sql).toContain(
      `check (patient_age between ${PATIENT_AGE_MIN} and ${PATIENT_AGE_MAX})`
    );
  });

  it("las fechas diarias no pueden ser futuras según el día de Lima", () => {
    for (const column of ["scan_date", "log_date", "taken_on", "started_on"]) {
      expect(sql).toContain(`check (${column} <= ${limaToday})`);
    }
  });

  it("los enums replican los valores del cliente", () => {
    expect(sql).toContain(
      `create type public.menopausal_status as enum (${sqlEnumList(MENOPAUSAL_STATUSES)})`
    );
    expect(sql).toContain(
      `create type public.stiffness_bucket as enum (${sqlEnumList(STIFFNESS_BUCKETS)})`
    );
    expect(sql).toContain(
      `create type public.dose_id as enum (${sqlEnumList(DOSE_SCHEDULE.map((dose) => dose.id))})`
    );
    expect(sql).toContain(
      `create type public.clinical_service_id as enum (${sqlEnumList(CLINICAL_SERVICE_IDS)})`
    );
    expect(sql).toContain(
      `create type public.appointment_status as enum (${sqlEnumList(APPOINTMENT_STATUSES)})`
    );
    expect(sql).toContain(`create type public.sex as enum (${sqlEnumList(SEXES)})`);
    expect(sql).toContain(`create type public.risk_level as enum (${sqlEnumList(RISK_LEVELS)})`);
    expect(sql).toContain(
      `create type public.consent_purpose as enum (${sqlEnumList(CONSENT_PURPOSES)})`
    );
    expect(sql).toContain(
      `create type public.appointment_slot as enum (${sqlEnumList(APPOINTMENT_SLOTS)})`
    );
    expect(sql).toContain(
      `create type public.appointment_booked_by as enum (${sqlEnumList(BOOKED_BY)})`
    );
  });

  it("el código de cita usa el mismo alfabeto que APPOINTMENT_CODE_PATTERN", () => {
    expect(sql).toContain(`check (code ~ '${APPOINTMENT_CODE_PATTERN.source.toLowerCase()}')`);
  });

  it("teléfono de cita y peso del perfil replican los límites de Zod", () => {
    expect(sql).toContain(
      `check (patient_phone ~ '${PATIENT_PHONE_PATTERN.source.toLowerCase()}')`
    );
    expect(sql).toContain(`check (weight_kg > 0 and weight_kg <= ${PROFILE_WEIGHT_MAX_KG})`);
  });

  it("el catálogo sembrado cubre cada producto de DOSE_SCHEDULE con BOTTLE_SERVINGS tomas", () => {
    for (const dose of DOSE_SCHEDULE) {
      // [^)]* no cruza a la fila siguiente: el 60 tiene que ser de este producto.
      expect(sql).toMatch(new RegExp(`\\('${dose.productId}', [^)]*, ${BOTTLE_SERVINGS}\\)`));
    }
  });
});
