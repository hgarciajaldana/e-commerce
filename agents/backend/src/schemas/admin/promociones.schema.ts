import { z } from "zod";

export const CreatePromocionSchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  imagen_url: z.string().url().optional().nullable(),
  tipo: z.enum(["dos_x_uno", "porcentaje", "bundle"]),
  compra_cantidad: z.number().int().min(1).optional().nullable(),
  llevas_cantidad: z.number().int().min(1).optional().nullable(),
  porcentaje: z.number().min(0).max(100).optional().nullable(),
  precio_original: z.number().min(0).optional().nullable(),
  precio_final: z.number().min(0),
  productos_ids: z.array(z.string()).optional().nullable(),
  activa: z.boolean().default(true),
  fecha_inicio: z.string().datetime().optional().nullable(),
  fecha_fin: z.string().datetime().optional().nullable(),
});

export const UpdatePromocionSchema = CreatePromocionSchema.partial().extend({
  version: z.number().int().min(0),
});
