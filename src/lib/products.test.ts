import { describe, expect, it } from "vitest";
import { supplementProductSchema, supplementProducts } from "./products";

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
