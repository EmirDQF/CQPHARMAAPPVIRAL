export type ProductBadge = "Alivio de Dolor" | "Densidad Ósea" | "Flexibilidad";

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
    badges: ["Densidad Ósea"],
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
    badges: ["Alivio de Dolor", "Flexibilidad"],
    formula: [
      "Colágeno hidrolizado bioasimilable",
      "Citrato de Magnesio de alta pureza",
      "Vitamina C pura",
    ],
    indication:
      "Artrosis, rigidez matutina y desgaste de cartílago en rodillas o manos.",
    priceNote: "Consumo diario, producto de alta rotación",
  },
  {
    id: "hueso-fuerte-360",
    name: "Pack Hueso Fuerte 360",
    tagline: "Citrato de Magnesio + Vitamina D3 + Zinc quelado",
    badges: ["Densidad Ósea"],
    formula: [
      "Citrato de Magnesio de alta pureza",
      "Vitamina D3",
      "Zinc quelado",
    ],
    indication:
      "Osteopenia, prevención de osteoporosis y fijación de calcio en el hueso.",
    priceNote: "Complemento obligatorio post-densitometría",
  },
  {
    id: "artikare-365",
    name: "Suscripción Artikare 365",
    tagline: "Entrega bimestral a domicilio + densitometría de control anual",
    badges: ["Densidad Ósea", "Alivio de Dolor", "Flexibilidad"],
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
