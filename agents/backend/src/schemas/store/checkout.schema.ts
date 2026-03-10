import { z } from "zod";

export const CheckoutBodySchema = z.object({
  clienteNombre: z.string().min(1, "Nombre requerido").max(200),
  clienteTelefono: z.string().min(1, "Teléfono requerido").max(50),
  clienteEmail: z.preprocess((v) => (v === null || v === undefined || v === "") ? undefined : v, z.string().email("Email invalido").optional()),
  clienteDireccion: z.string().max(500).optional().nullable(),
  notas: z.string().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        varianteId: z.string().min(1),
        cantidad: z.number().int().min(1, "Cantidad mínima: 1"),
      })
    )
    .min(1, "El carrito debe tener al menos un item"),
});

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;
