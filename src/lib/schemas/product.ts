import { z } from "zod";

/**
 * Fila de `products` (catálogo CQ Pharma, solo lectura para el paciente).
 * Un producto puede existir inactivo mientras faltan sus datos regulatorios,
 * pero nunca activarse sin registro DIGEMID, presentación y precio.
 */
export const productRowSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,64}$/),
    name: z.string().min(1).max(120),
    composition: z.array(z.string().min(1)).min(1),
    digemid_registration: z.string().min(1).nullable(),
    presentation: z.string().min(1).nullable(),
    doses_per_bottle: z.number().int().positive(),
    price_pen: z.number().positive().nullable(),
    active: z.boolean(),
  })
  .refine(
    (product) =>
      !product.active ||
      (product.digemid_registration !== null &&
        product.presentation !== null &&
        product.price_pen !== null),
    { message: "Un producto activo requiere registro DIGEMID, presentación y precio" }
  );

export type ProductRow = z.infer<typeof productRowSchema>;
