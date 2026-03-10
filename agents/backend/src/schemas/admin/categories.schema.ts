import { z } from "zod";

export const CreateCategorySchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  imagenUrl: z.string().url().optional().nullable(),
  orden: z.number().int().min(0).optional().default(0),
  padreId: z.string().optional().nullable(),
});

export const UpdateCategorySchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional().nullable(),
  imagenUrl: z.string().url().optional().nullable(),
  orden: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
  padreId: z.string().optional().nullable(),
  version: z.number().int().min(1, "version requerido para OCC"),
});

export const CategoriesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  activo: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});

export type CreateCategoryBody = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof UpdateCategorySchema>;
