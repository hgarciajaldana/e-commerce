import { z } from "zod";

export const CreateColeccionSchema = z.object({
  nombre: z.string().min(1).max(300),
  descripcion: z.string().max(5000).optional().nullable(),
  imagen_url: z.string().url().optional().nullable(),
  activa: z.boolean().optional().default(true),
  orden: z.number().int().min(0).optional().default(0),
});

export const UpdateColeccionSchema = z.object({
  nombre: z.string().min(1).max(300).optional(),
  descripcion: z.string().max(5000).optional().nullable(),
  imagen_url: z.string().url().optional().nullable(),
  activa: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
});

export const AsignarProductoSchema = z.object({
  productoId: z.string().min(1),
  orden: z.number().int().min(0).optional().default(0),
});

export type CreateColeccionBody = z.infer<typeof CreateColeccionSchema>;
export type UpdateColeccionBody = z.infer<typeof UpdateColeccionSchema>;
export type AsignarProductoBody = z.infer<typeof AsignarProductoSchema>;
