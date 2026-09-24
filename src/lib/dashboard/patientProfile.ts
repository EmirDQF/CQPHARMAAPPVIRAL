import type { ConsentRecord } from "../privacy/consent";
import { createPersistentStore } from "../storage/persistentStore";
import type { Sex } from "../types";

export interface PatientProfile {
  name: string;
  age: number | null;
  sex: Sex | null;
  weightKg: number | null;
  hasFractureHistory: boolean;
  allergies: string;
  phone: string;
  /** Ausente en perfiles guardados antes del consentimiento (v1): se pide al volver a guardar. */
  consent?: ConsentRecord;
}

export const emptyPatientProfile: PatientProfile = {
  name: "",
  age: null,
  sex: null,
  weightKg: null,
  hasFractureHistory: false,
  allergies: "",
  phone: "",
};

export const patientProfileStore = createPersistentStore<PatientProfile>(
  "artikare_patient_profile_v1",
  emptyPatientProfile
);
