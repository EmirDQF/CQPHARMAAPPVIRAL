import { z } from "zod";

export type ProductBadge = "Salud Articular" | "Salud Ósea" | "Flexibilidad";

export interface ProductPack {
  id: string;
  name: string;
  tagline: string;
  badges: ProductBadge[];
  formula: string[];
  indication: string;
  priceNote: string;
}

export const productPacks: ProductPack[] = [
  {
    id: "diagnostico-oseo",
    name: "Pack Diagnóstico Óseo",
    tagline: "Densitometría + lectura de T-Score + asesoría nutricional inicial",
    badges: ["Salud Ósea"],
    formula: [
      "Densitometría ósea computarizada",
      "Lectura médica de T-Score",
      "Asesoría nutricional inicial",
    ],
    indication:
      "Ideal desde los 45 años, con antecedentes familiares, menopausia o dolor lumbar persistente.",
    priceNote: "Flujo de caja inmediato en consultorio",
  },
  {
    id: "movilidad-total",
    name: "Pack Movilidad Total",
    tagline: "Colágeno hidrolizado + Citrato de Magnesio + Vitamina C pura",
    badges: ["Salud Articular", "Flexibilidad"],
    formula: [
      "Colágeno hidrolizado bioasimilable",
      "Citrato de Magnesio de alta pureza",
      "Vitamina C pura",
    ],
    indication:
      "Acompaña el cuidado articular indicado por tu médico si tienes rigidez matutina o molestias en rodillas o manos.",
    priceNote: "Consumo diario, producto de alta rotación",
  },
  {
    id: "hueso-fuerte-360",
    name: "Pack Hueso Fuerte 360",
    tagline: "Citrato de Magnesio + Vitamina D3 + Zinc quelado",
    badges: ["Salud Ósea"],
    formula: [
      "Citrato de Magnesio de alta pureza",
      "Vitamina D3",
      "Zinc quelado",
    ],
    indication:
      "Apoya tu salud ósea como complemento del tratamiento que indique tu médico tras tu densitometría.",
    priceNote: "Complemento sugerido tras la densitometría",
  },
  {
    id: "artikare-365",
    name: "Suscripción Artikare 365",
    tagline: "Entrega bimestral a domicilio + densitometría de control anual",
    badges: ["Salud Ósea", "Salud Articular", "Flexibilidad"],
    formula: [
      "Reabastecimiento bimestral de tu protocolo",
      "Densitometría de control incluida cada 12 meses",
      "Seguimiento clínico continuo",
    ],
    indication:
      "Pacientes crónicos o familias comprometidas con la salud ósea a largo plazo.",
    priceNote: "Mayor retención y valor a largo plazo (LTV)",
  },
];

/**
 * Suplemento individual del catálogo CQ Pharma. Todos los campos regulatorios
 * son obligatorios: ningún producto (p. ej. Kolflex) se publica sin su
 * registro sanitario DIGEMID, composición, presentación, tomas y precio.
 */
export const supplementProductSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  composition: z.array(z.string().trim().min(1)).min(1),
  digemidRegistration: z.string().trim().min(1),
  presentation: z.string().trim().min(1),
  dosesPerBottle: z.number().int().positive(),
  pricePen: z.number().positive(),
});

export type SupplementProduct = z.infer<typeof supplementProductSchema>;

/** Vacío hasta recibir los datos regulatorios de cada producto (Hito F). */
export const supplementProducts: SupplementProduct[] = [];
