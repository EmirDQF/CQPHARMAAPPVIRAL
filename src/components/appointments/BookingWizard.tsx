"use client";

import { useMemo, useState } from "react";
import { buildAvailableDays } from "@/lib/appointments/availability";
import { bookAppointment } from "@/lib/appointments/store";
import { registerAppointmentForAnalytics } from "@/lib/api/registerAppointment";
import type { ConsentRecord } from "@/lib/privacy/consent";
import type {
  Appointment,
  AppointmentPatient,
  AppointmentSlot,
  ClinicalServiceId,
} from "@/lib/appointments/types";
import { ConfirmationCard } from "./ConfirmationCard";
import { DateTimeStep } from "./DateTimeStep";
import { PatientDataStep } from "./PatientDataStep";
import { ServiceStep } from "./ServiceStep";

type WizardStep = 1 | 2 | 3;

function StepProgress({ currentStep }: { currentStep: WizardStep }) {
  return (
    <div className="flex gap-2" aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`h-2 flex-1 rounded-full transition-colors ${
            step <= currentStep ? "bg-brand" : "bg-neutral-200 dark:bg-neutral-800"
          }`}
        />
      ))}
    </div>
  );
}

export function BookingWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [serviceId, setServiceId] = useState<ClinicalServiceId | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<AppointmentSlot | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(
    null
  );

  const availableDays = useMemo(() => buildAvailableDays(), []);

  function handleServiceSelected(id: ClinicalServiceId) {
    setServiceId(id);
    setStep(2);
  }

  function handleDateTimeSelected(selectedDate: string, selectedSlot: AppointmentSlot) {
    setDate(selectedDate);
    setSlot(selectedSlot);
    setStep(3);
  }

  function handlePatientSubmit(patient: AppointmentPatient, consent: ConsentRecord) {
    if (!serviceId || !date || !slot) return;
    const appointment = bookAppointment({ serviceId, date, slot, patient, consent });
    registerAppointmentForAnalytics(appointment);
    setConfirmedAppointment(appointment);
  }

  if (confirmedAppointment) {
    return <ConfirmationCard appointment={confirmedAppointment} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <StepProgress currentStep={step} />
      {step === 1 && <ServiceStep onSelect={handleServiceSelected} />}
      {step === 2 && serviceId && (
        <DateTimeStep
          availableDays={availableDays}
          onBack={() => setStep(1)}
          onSelect={handleDateTimeSelected}
        />
      )}
      {step === 3 && (
        <PatientDataStep onBack={() => setStep(2)} onSubmit={handlePatientSubmit} />
      )}
    </div>
  );
}
