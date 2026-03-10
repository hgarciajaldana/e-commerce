import { prisma } from "../lib/prisma";
import { TenantContext } from "../middleware/tenant.middleware";
import { AppError } from "../utils/errors";

export async function resolveTenant(slug: string): Promise<TenantContext> {
  const empresa = await prisma.empresa.findFirst({
    where: { subdominio: slug, deleted_at: null },
    include: {
      configuracion: {
        select: { moneda: true, datos_tienda: true },
      },
    },
  });

  if (!empresa) {
    throw new AppError(404, "TENANT_NOT_FOUND", `Empresa '${slug}' no encontrada`);
  }
  if (!empresa.activa) {
    throw new AppError(403, "TENANT_INACTIVE", "Esta tienda está desactivada");
  }

  const datosTienda = empresa.configuracion?.datos_tienda as Record<string, unknown> | null;

  return {
    empresaId: empresa.id,
    subdominio: empresa.subdominio,
    moneda: empresa.configuracion?.moneda ?? "ARS",
    monedaSimbolo: (datosTienda?.monedaSimbolo as string) ?? "$",
    whatsappNumero: (datosTienda?.whatsappNumero as string) ?? null,
    mensajeTemplate: (datosTienda?.mensajeTemplate as string) ?? null,
  };
}
