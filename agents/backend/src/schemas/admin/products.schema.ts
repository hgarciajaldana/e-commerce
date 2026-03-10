import { z } from "zod";

export const CreateProductSchema = z.object({
  nombre: z.string().min(1).max(300),
  descripcion: z.string().max(5000).optional().nullable(),
  precio: z.number().positive("El precio debe ser positivo"),
  categoriaId: z.string().optional().nullable(),
  destacado: z.boolean().optional().default(false),
  en_promocion: z.boolean().optional().default(false),
  stock: z.number().int().min(0).optional().default(0),
  imagenes: z
    .array(
      z.object({
        url: z.string().url(),
        orden: z.number().int().min(0).optional().default(0),
        esPrincipal: z.boolean().optional().default(false),
      })
    )
    .optional(),
  variantes: z
    .array(
      z.object({
        nombre: z.string().min(1).max(200),
        sku: z.string().max(100).optional(),
        precio: z.number().positive().optional(),
        stock: z.number().int().min(0).optional().default(0),
      })
    )
    .optional(),
});

export const UpdateProductSchema = z.object({
  nombre: z.string().min(1).max(300).optional(),
  descripcion: z.string().max(5000).optional().nullable(),
  precio: z.number().positive().optional(),
  categoriaId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  destacado: z.boolean().optional(),
  en_promocion: z.boolean().optional(),
  version: z.number().int().min(1, "version requerido para OCC"),
});

export const ProductsQuerySchema = z.object({
  categoriaId: z.string().optional(),
  busqueda: z.string().max(200).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  activo: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});

export type CreateProductBody = z.infer<typeof CreateProductSchema>;
export type UpdateProductBody = z.infer<typeof UpdateProductSchema>;
