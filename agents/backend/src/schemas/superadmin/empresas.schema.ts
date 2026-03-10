import { z } from "zod";

export const CreateEmpresaSchema = z.object({
  nombre: z.string().min(1).max(200),
  nit: z.string().min(1).max(50, "Máximo 50 caracteres"),
  subdominio: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  portal_company_id: z.string().uuid("Debe ser un UUID válido").optional(),
  plan: z.string().max(50).optional().default("basic"),
  configuracion: z.record(z.unknown()).optional(),
});

export const UpdateEmpresaSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  activa: z.boolean().optional(),
  plan: z.string().max(50).optional(),
  portal_company_id: z.string().uuid("Debe ser un UUID válido").optional(),
});

export const EmpresasQuerySchema = z.object({
  activa: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateEmpresaBody = z.infer<typeof CreateEmpresaSchema>;
export type UpdateEmpresaBody = z.infer<typeof UpdateEmpresaSchema>;
