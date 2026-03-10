import { z } from "zod";

const VALID_ESTADOS = [
  "pendiente",
  "confirmado",
  "procesando",
  "enviado",
  "entregado",
  "cancelado",
] as const;

// Transiciones válidas de estado
const VALID_TRANSITIONS: Record<string, string[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["procesando", "cancelado"],
  procesando: ["enviado", "cancelado"],
  enviado: ["entregado"],
  entregado: [],
  cancelado: [],
};

export const UpdateOrderStatusSchema = z
  .object({
    estado: z.enum(VALID_ESTADOS),
    notas: z.string().max(1000).optional().nullable(),
  })
  .refine(
    // La validación de transición se hace en el controller con el estado actual
    (data) => VALID_ESTADOS.includes(data.estado),
    { message: "Estado inválido" }
  );

export const OrdersQuerySchema = z.object({
  estado: z.enum(VALID_ESTADOS).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export { VALID_TRANSITIONS };
export type UpdateOrderStatusBody = z.infer<typeof UpdateOrderStatusSchema>;
