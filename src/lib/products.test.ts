import { describe, expect, it } from "vitest";
import { productPacks, supplementProductSchema, supplementProducts } from "./products";

const completeProduct = {
  id: "producto-ejemplo",
  name: "Producto de ejemplo",
  composition: ["Colágeno hidrolizado 10 g"],
  digemidRegistration: "N-12345",
  presentation: "Frasco de 300 g",
  dosesPerBottle: 30,
  pricePen: 89.9,
};

describe("supplementProductSchema (B5)", () => {
  it("accepts a product with every regulatory field", () => {
    expect(supplementProductSchema.safeParse(completeProduct).success).toBe(true);
  });

  it.each(["composition", "digemidRegistration", "presentation", "dosesPerBottle", "pricePen"])(
    "rejects a product without %s",
    (field) => {
      const incomplete = { ...completeProduct, [field]: undefined };
      expect(supplementProductSchema.safeParse(incomplete).success).toBe(false);
    }
  );

  it("rejects an empty DIGEMID registration and zero doses", () => {
    expect(
      supplementProductSchema.safeParse({ ...completeProduct, digemidRegistration: " " }).success
    ).toBe(false);
    expect(
      supplementProductSchema.safeParse({ ...completeProduct, dosesPerBottle: 0 }).success
    ).toBe(false);
  });

  it("every catalog supplement is complete", () => {
    for (const product of supplementProducts) {
      expect(supplementProductSchema.safeParse(product).success).toBe(true);
    }
  });

  it("does not list Kolflex until its regulatory data is provided", () => {
    expect(supplementProducts.some((product) => /kolflex/i.test(product.name))).toBe(false);
  });
});

describe("Pack Diagnóstico Óseo", () => {
  const diagnosticPack = productPacks.find((pack) => pack.id === "diagnostico-oseo");

  it("offers vitamin D testing, DMO and nutritional counseling", () => {
    expect(diagnosticPack?.name).toBe("Pack Diagnóstico Óseo");
    expect(diagnosticPack?.tagline).toBe("Dosaje de vitamina D + DMO + asesoría nutricional");
    expect(diagnosticPack?.formula).toEqual([
      "Dosaje de vitamina D",
      "DMO (densitometría ósea)",
      "Asesoría nutricional",
    ]);
  });

  it("targets people from 45 with a first-degree relative's hip or vertebral fracture", () => {
    expect(diagnosticPack?.indication).toBe(
      "Ideal desde los 45 años con antecedentes de fractura de cadera o de vértebra en un familiar directo (por ejemplo, mamá)."
    );
  });

  it("no longer mentions T-Score reading, menopause or low back pain", () => {
    const copy = JSON.stringify(diagnosticPack);
    expect(copy).not.toMatch(/T-Score|lectura|inicial|menopausia|dolor lumbar/i);
  });
});
