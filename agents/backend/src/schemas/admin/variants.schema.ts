import { z } from "zod";

export const CreateVariantSchema = z.object({
  nombre: z.string().min(1).max(200),
  sku: z.string().max(100).optional(),
  precio: z.number().positive().optional(),
  stock: z.number().int().min(0).optional().default(0),
  atributos: z.record(z.unknown()).optional().nullable(),
});

export const UpdateVariantSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  precio: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  activa: z.boolean().optional(),
  atributos: z.record(z.unknown()).optional().nullable(),
  version: z.number().int().min(1, "version requerido para OCC"),
});

export type CreateVariantBody = z.infer<typeof CreateVariantSchema>;
export type UpdateVariantBody = z.infer<typeof UpdateVariantSchema>;
