import {
  emptyPatientProfile,
  patientProfileStore,
  type PatientProfile,
} from "../dashboard/patientProfile";
import { profileRowSchema, profileUpsertSchema } from "../schemas/profile";
import { keepValid, selectRows, upsertRows, type RepositoryClient } from "./supabaseRows";
import type { RecordRepository, SyncRecord } from "./types";

/**
 * Perfil clínico sin el consentimiento local: ese registro legal se queda en
 * el celular; en la base los consentimientos viven en `consents`.
 */
export type ProfileValue = Omit<PatientProfile, "consent">;

/** Un perfil por paciente (`profiles.id` = auth.uid()); como mucho un registro. */
export type ProfileRepository = RecordRepository<ProfileValue>;

export const PROFILE_KEY = "profile";

const TABLE = "profiles";
const LIST_COLUMNS =
  "name, age, sex, menopausal_status, has_fracture_history, weight_kg, allergies, phone, updated_at";
const listedRowSchema = profileRowSchema.pick({
  name: true,
  age: true,
  sex: true,
  menopausal_status: true,
  has_fracture_history: true,
  weight_kg: true,
  allergies: true,
  phone: true,
  updated_at: true,
});

const PROFILE_FIELDS = Object.keys(emptyPatientProfile) as (keyof typeof emptyPatientProfile)[];

/** Sin ningún dato cargado no hay perfil que respaldar. */
function isBlank(profile: PatientProfile): boolean {
  return PROFILE_FIELDS.every((field) => profile[field] === emptyPatientProfile[field]);
}

function toRecord(value: ProfileValue): SyncRecord<ProfileValue> {
  return { key: PROFILE_KEY, value, updatedAt: value.updatedAt ?? null };
}

function withoutConsent(profile: PatientProfile): ProfileValue {
  const { name, age, sex, weightKg, hasFractureHistory, menopausalStatus, allergies, phone, updatedAt } =
    profile;
  return {
    name,
    age,
    sex,
    weightKg,
    hasFractureHistory,
    menopausalStatus,
    allergies,
    phone,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function createLocalProfileRepository(): ProfileRepository {
  return {
    async list() {
      const profile = patientProfileStore.getSnapshot();
      return isBlank(profile) ? [] : [toRecord(withoutConsent(profile))];
    },
    async upsertMany(values) {
      const latest = values.at(-1);
      if (!latest) return;
      const { consent } = patientProfileStore.getSnapshot();
      patientProfileStore.write({ ...latest, ...(consent ? { consent } : {}) });
    },
  };
}

export function createSupabaseProfileRepository(client: RepositoryClient): ProfileRepository {
  return {
    async list() {
      const rows = await selectRows(client, TABLE, LIST_COLUMNS, listedRowSchema);
      return rows.slice(0, 1).map((row) =>
        toRecord({
          name: row.name,
          age: row.age,
          sex: row.sex,
          weightKg: row.weight_kg,
          hasFractureHistory: row.has_fracture_history,
          menopausalStatus: row.menopausal_status,
          allergies: row.allergies,
          phone: row.phone,
          updatedAt: row.updated_at,
        })
      );
    },
    async upsertMany(values) {
      const candidates = values.slice(-1).map((value) => ({
        name: value.name,
        age: value.age,
        sex: value.sex,
        menopausal_status: value.menopausalStatus,
        has_fracture_history: value.hasFractureHistory,
        weight_kg: value.weightKg,
        allergies: value.allergies,
        phone: value.phone,
      }));
      const rows = keepValid(candidates, profileUpsertSchema, TABLE);
      await upsertRows(client, TABLE, rows, { onConflict: "id" });
    },
  };
}
