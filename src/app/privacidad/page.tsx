import type { Metadata } from "next";
import Link from "next/link";
import { CONSENT_VERSION } from "@/lib/privacy/consent";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo Artikare y CQ Pharma tratan tus datos personales y de salud conforme a la Ley N.º 29733.",
};

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. Responsable del tratamiento",
    paragraphs: [
      "Artikare, plataforma respaldada por CQ Pharma (razón social, RUC y domicilio: [por completar antes de la publicación definitiva]).",
    ],
  },
  {
    title: "2. Datos que recopilamos",
    paragraphs: [
      "Test de Edad Articular: edad, sexo y respuestas del cuestionario. Solo enviamos al servidor un resumen anónimo (edad, edad articular estimada y nivel de riesgo), sin datos de contacto.",
      "Citas: nombre, edad y teléfono del paciente, servicio, fecha y horario elegidos.",
      "Mi Panel: perfil médico, registros de dolor y rigidez, tomas de suplementos y resultados de densitometría que tú mismo ingresas.",
    ],
  },
  {
    title: "3. Finalidad",
    paragraphs: [
      "Gestionar tus citas, mostrarte tu seguimiento clínico y permitirte compartirlo con tu médico. No vendemos tus datos ni los usamos para publicidad de terceros.",
    ],
  },
  {
    title: "4. Dónde se guardan",
    paragraphs: [
      "La información de Mi Panel se guarda en el almacenamiento local de tu dispositivo. Los datos de tus citas se envían a nuestro servidor únicamente después de que marques la casilla de consentimiento.",
      "Nunca incluimos datos personales o de salud en enlaces, parámetros de URL ni eventos de analítica.",
    ],
  },
  {
    title: "5. Tus derechos (ARCO)",
    paragraphs: [
      "Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos escribiendo a [correo de privacidad por completar]. También puedes borrar los datos de Mi Panel limpiando los datos del sitio en tu navegador.",
      "Si consideras que tus derechos no fueron atendidos, puedes acudir a la Autoridad Nacional de Protección de Datos Personales (Ministerio de Justicia y Derechos Humanos).",
      "Si borras un registro desde Mis registros, deja de mostrarse y de contarse en tus reportes, y puedes deshacerlo durante 30 días; después se elimina. Borrar tu cuenta elimina de forma definitiva todos tus datos clínicos, aunque hayas borrado algunos antes.",
    ],
  },
  {
    title: "6. Consentimiento",
    paragraphs: [
      "Registramos la fecha y la versión de esta política que aceptaste. Si la política cambia, te pediremos un nuevo consentimiento.",
      "Si borras tu cuenta, conservamos solo una prueba seudonimizada de que diste y retiraste tu consentimiento: un código que no permite identificarte a simple vista, la finalidad, la versión de la política y las fechas, sin tu nombre, correo, teléfono ni datos de salud. Pendiente de revisión legal (Ley 29733).",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
      <Link href="/" className="text-sm text-brand font-semibold">
        ← Volver a Artikare
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">Política de Privacidad</h1>
        <p className="text-sm text-neutral-500">
          Versión provisional {CONSENT_VERSION} · Ley N.º 29733 de Protección de Datos Personales
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base text-neutral-700 dark:text-neutral-300">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </main>
  );
}
