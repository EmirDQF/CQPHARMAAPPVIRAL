// Sin I, O, 0 ni 1 para evitar confusiones al dictar el código por teléfono.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export const APPOINTMENT_CODE_PATTERN = new RegExp(`^ART-[${CODE_CHARS}]{${CODE_LENGTH}}$`);

export function generateAppointmentCode(): string {
  // CSPRNG: el código identifica la cita ante el consultorio.
  const randomValues = crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  return `ART-${Array.from(randomValues, (value) => CODE_CHARS[value % CODE_CHARS.length]).join("")}`;
}
