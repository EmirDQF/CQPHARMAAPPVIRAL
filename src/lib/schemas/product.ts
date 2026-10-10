import { z } from "zod";
import { hasAtMostDecimals, timestampSchema } from "./shared";

/** Slug del catálogo; replica el CHECK de `products.id` (y lo heredan las FK `product_id`). */
export const PRODUCT_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
export const productIdSchema = z.string().regex(PRODUCT_ID_PATTERN);

/** `price_pen numeric(10, 2)`: céntimos de sol, nunca un tercer decimal. */
const PRICE_DECIMALS = 2;

/**
 * Fila de `products` (catálogo CQ Pharma, solo lectura para el paciente).
 * Un producto puede existir inactivo mientras faltan sus datos regulatorios,
 * pero nunca activarse sin registro DIGEMID, presentación y precio.
 */
export const productRowSchema = z
  .object({
    id: productIdSchema,
    name: z.string().min(1).max(120),
    composition: z.array(z.string().min(1)).min(1),
    digemid_registration: z.string().min(1).nullable(),
    presentation: z.string().min(1).nullable(),
    doses_per_bottle: z.number().int().positive(),
    price_pen: z
      .number()
      .positive()
      .refine((price) => hasAtMostDecimals(price, PRICE_DECIMALS), {
        message: "El precio admite hasta 2 decimales",
      })
      .nullable(),
    active: z.boolean(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
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
