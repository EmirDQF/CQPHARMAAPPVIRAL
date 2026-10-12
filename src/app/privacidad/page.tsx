import type { Metadata } from "next";
import Link from "next/link";
import { SOFT_DELETE_RESTORE_DAYS } from "@/lib/clinical/constants";
import { CONSENT_VERSION } from "@/lib/privacy/consent";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo Artikare y CQ Pharma tratan tus datos personales y de salud conforme a la Ley N.º 29733.",
};

/** Canal ARCO: se completa con el correo real antes de publicar (docs/ROADMAP.md). */
const PRIVACY_CONTACT = "[correo de privacidad por completar]";

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. Responsable del tratamiento",
    paragraphs: [
      "Artikare, plataforma respaldada por CQ Pharma (razón social, RUC y domicilio: [por completar antes de la publicación definitiva]).",
      `Canal de contacto para privacidad y derechos ARCO: ${PRIVACY_CONTACT}.`,
    ],
  },
  {
    title: "2. Datos que recopilamos",
    paragraphs: [
      "Test de Edad Articular: edad, sexo y respuestas del cuestionario. Solo enviamos al servidor un resumen (edad, edad articular estimada y nivel de riesgo), sin datos de contacto.",
      "Citas: nombre, edad y teléfono del paciente, servicio, fecha y horario elegidos.",
      "Mi Panel: perfil médico, registros de dolor y rigidez, tomas de suplementos, frascos y resultados de densitometría que tú mismo ingresas.",
      "Cuenta (opcional): tu correo electrónico, para enviarte el código de acceso. La app se usa completa sin cuenta.",
    ],
  },
  {
    title: "3. Finalidad",
    paragraphs: [
      "Mostrarte tu seguimiento (semáforo óseo, diario de dolor, pastillero y reposición), gestionar tus citas, permitirte compartir tu reporte con tu médico y, si lo autorizas, respaldar Mi Panel en tu cuenta para no perderlo al cambiar de celular.",
      "No vendemos tus datos, no los usamos para publicidad de terceros y no hacemos perfiles de marketing con tus datos de salud. La app es informativa y no reemplaza el consejo médico.",
    ],
  },
  {
    title: "4. Consentimiento",
    paragraphs: [
      `Te pedimos un consentimiento separado para cada finalidad (perfil clínico, cita y respaldo en la cuenta). Registramos la fecha y la versión de esta política que aceptaste (versión vigente: ${CONSENT_VERSION}). Si la política cambia, te pediremos un nuevo consentimiento.`,
      "Si borras tu cuenta, conservamos solo una prueba seudonimizada de que diste y retiraste tu consentimiento: un código que no permite identificarte a simple vista, la finalidad, la versión de la política y las fechas, sin tu nombre, correo, teléfono ni datos de salud. Pendiente de revisión legal (Ley 29733).",
    ],
  },
  {
    title: "5. Dónde se guardan y transferencia internacional",
    paragraphs: [
      "Mi Panel se guarda en el almacenamiento local de tu celular. Solo sale de él si creas una cuenta y autorizas expresamente el respaldo.",
      "Los datos que llegan a nuestro servidor (citas, resumen del test y, si lo autorizas, el respaldo de Mi Panel) se alojan en Supabase, en su región de São Paulo, Brasil (sa-east-1). Esto es una transferencia internacional de datos personales, que realizamos con tu consentimiento y con un proveedor que aplica cifrado en tránsito y en reposo.",
      "Otros encargados: Resend (envío del código de acceso a tu correo), Cloudflare Turnstile (verificación contra robots) y el proveedor de alojamiento de la web. Ninguno recibe tus datos de salud.",
      "Nunca incluimos datos personales o de salud en enlaces, parámetros de URL, notificaciones, tarjetas para compartir ni eventos de analítica.",
    ],
  },
  {
    title: "6. Plazos de conservación",
    paragraphs: [
      "Mi Panel en tu celular: hasta que lo borres desde Ajustes o borres los datos del sitio o de la app.",
      "Cuenta y respaldo: mientras tengas la cuenta. Al borrarla, se elimina de inmediato y de forma definitiva.",
      `Si borras un registro desde Mis registros, deja de mostrarse y de contarse en tus reportes, y puedes deshacerlo durante ${SOFT_DELETE_RESTORE_DAYS} días; después se elimina. Borrar tu cuenta elimina de forma definitiva todos tus datos clínicos, aunque hayas borrado algunos antes.`,
      "Citas: el tiempo necesario para atenderte y cumplir obligaciones legales ([plazo por definir con asesoría legal]).",
    ],
  },
  {
    title: "7. Tus derechos (ARCO)",
    paragraphs: [
      "Desde Mi Panel → Ajustes puedes, sin trámites: descargar todos tus datos (acceso), corregir tu perfil y tus registros (rectificación), retirar el respaldo en la cuenta (oposición) y borrar tu cuenta y tus datos (cancelación).",
      `También puedes escribirnos a ${PRIVACY_CONTACT}. Responderemos dentro de los plazos de la Ley N.º 29733 y su reglamento (20 días hábiles para el acceso y 10 días hábiles para rectificación, cancelación u oposición).`,
      "Si consideras que tus derechos no fueron atendidos, puedes acudir a la Autoridad Nacional de Protección de Datos Personales (Ministerio de Justicia y Derechos Humanos).",
    ],
  },
  {
    title: "8. App en el celular",
    paragraphs: [
      "Los recordatorios de tomas son notificaciones locales: se programan en tu celular, su texto no menciona tu salud y puedes desactivarlas cuando quieras. No usamos publicidad, rastreo entre apps ni identificadores publicitarios.",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 flex flex-col gap-6">
      <Link href="/" className="text-sm text-clinic font-semibold">
        ← Volver a Artikare
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold">Política de Privacidad</h1>
        <p className="text-lg text-muted">
          Versión provisional {CONSENT_VERSION} · Ley N.º 29733 de Protección de Datos Personales
        </p>
        <p className="rounded-xl bg-amber-100 dark:bg-amber-900/40 px-4 py-2 text-lg font-semibold text-amber-900 dark:text-amber-100">
          Pendiente de revisión legal: este texto puede cambiar antes de la publicación definitiva.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-lg text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </main>
  );
}
