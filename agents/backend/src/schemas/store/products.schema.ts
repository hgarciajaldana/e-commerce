import { z } from "zod";

export const ProductsQuerySchema = z.object({
  categoriaId: z.string().optional(),
  busqueda: z.string().max(200).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  destacado: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  en_promocion: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});

export type ProductsQuery = z.infer<typeof ProductsQuerySchema>;
