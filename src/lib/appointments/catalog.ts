import type { ClinicalService, ClinicalServiceId } from "./types";

export const clinicalServices: ClinicalService[] = [
  {
    id: "densitometria",
    name: "Densitometría Ósea Computarizada",
    description:
      "Medición precisa de tu densidad mineral ósea (T-Score) en columna y cadera.",
    durationMinutes: 20,
    prepInstructions:
      "No ingieras suplementos de calcio en las 24 horas previas a tu densitometría.",
  },
  {
    id: "consulta-reumatologia",
    name: "Consulta con Especialista en Reumatología",
    description:
      "Evaluación clínica completa de tus articulaciones con un médico reumatólogo.",
    durationMinutes: 30,
    prepInstructions:
      "Trae contigo tus estudios previos y la lista de suplementos o medicamentos que tomas actualmente.",
  },
  {
    id: "control-preventivo",
    name: "Control Preventivo Articular",
    description:
      "Revisión periódica de tu progreso y ajuste de tu protocolo de suplementación.",
    durationMinutes: 15,
    prepInstructions: null,
  },
];

export function getServiceById(id: ClinicalServiceId): ClinicalService | undefined {
  return clinicalServices.find((service) => service.id === id);
}
