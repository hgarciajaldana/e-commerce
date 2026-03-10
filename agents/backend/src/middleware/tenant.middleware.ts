import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";

export interface TenantContext {
  empresaId: string;
  subdominio: string;
  moneda: string;
  monedaSimbolo: string;
  whatsappNumero: string | null;
  mensajeTemplate: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      auth?: {
        userId: string;
        companyId: string;
        planId: string;
        role: string;
      };
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadTenantByField(
  field: "subdominio" | "portal_company_id" | "nit",
  value: string,
  errorCode: string,
  errorMsg: string,
  req: Request,
  next: NextFunction
): Promise<boolean> {
  const empresa = await prisma.empresa.findFirst({
    where: { [field]: value, deleted_at: null },
    include: {
      configuracion: {
        select: { moneda: true, datos_tienda: true },
      },
    },
  });

  if (!empresa) {
    next(new AppError(404, errorCode, errorMsg));
    return false;
  }

  if (!empresa.activa) {
    next(new AppError(403, "TENANT_INACTIVE", "Esta tienda está desactivada"));
    return false;
  }

  const datosTienda = empresa.configuracion?.datos_tienda as Record<string, unknown> | null;

  req.tenant = {
    empresaId: empresa.id,
    subdominio: empresa.subdominio,
    moneda: empresa.configuracion?.moneda ?? "ARS",
    monedaSimbolo: (datosTienda?.monedaSimbolo as string) ?? "$",
    whatsappNumero: (datosTienda?.whatsappNumero as string) ?? null,
    mensajeTemplate: (datosTienda?.mensajeTemplate as string) ?? null,
  };

  return true;
}

// ── Middleware para rutas públicas de tienda (por subdominio o header) ────────

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const slug =
    (req.headers["x-empresa-slug"] as string | undefined) ||
    extractSlugFromHost(req.hostname);

  if (!slug) {
    next(new AppError(400, "MISSING_TENANT", "Header x-empresa-slug requerido"));
    return;
  }

  try {
    const ok = await loadTenantByField(
      "subdominio",
      slug,
      "TENANT_NOT_FOUND",
      `Empresa '${slug}' no encontrada`,
      req,
      next
    );
    if (ok) next();
  } catch (err) {
    next(err);
  }
}

// ── Middleware para rutas admin (resuelve tenant por NIT en header) ──────────

export async function resolveAdminTenant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const nit = req.headers["x-empresa-nit"] as string | undefined;

  if (!nit) {
    next(new AppError(400, "MISSING_NIT", "Header x-empresa-nit requerido"));
    return;
  }

  try {
    const ok = await loadTenantByField(
      "nit",
      nit,
      "TENANT_NOT_FOUND",
      `Empresa con NIT '${nit}' no encontrada`,
      req,
      next
    );
    if (ok) next();
  } catch (err) {
    next(err);
  }
}

const ECOMMERCE_SUFFIX = "-ecommerce.operly.tech";
// Hostname propio del backend — nunca es un tenant
const API_HOSTNAME = (process.env.API_HOSTNAME ?? "api-ecommerce.operly.tech").toLowerCase();

function extractSlugFromHost(hostname: string): string | null {
  if (!hostname || /^[\d.]+$/.test(hostname) || hostname === "localhost") return null;
  if (hostname === API_HOSTNAME) return null;

  // Patrón {slug}-ecommerce.operly.tech (wildcard SSL sobre *.operly.tech)
  if (hostname.endsWith(ECOMMERCE_SUFFIX)) {
    return hostname.slice(0, -ECOMMERCE_SUFFIX.length) || null;
  }

  // Patrón {slug}.ecommerce.operly.tech (futuro con ACM)
  const parts = hostname.split(".");
  if (parts.length >= 4 && parts.slice(1).join(".") === "ecommerce.operly.tech") {
    return parts[0];
  }

  return null;
}
