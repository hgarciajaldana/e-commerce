import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

const PORTAL_API =
  process.env.PORTAL_API_URL ?? "https://api-portal-clientes.operly.tech";

// ── Tipos del portal ──────────────────────────────────────────────────────────

interface PortalUser {
  user_id: string;
  company_id: string;
  plan_id: string;
  role: "ADMIN" | "USER";
  iat: number;
  exp: number;
}

interface CacheEntry {
  user: PortalUser;
  expiresAt: number;
}

// ── Caché en memoria (token → usuario verificado) ─────────────────────────────
// TTL = min(5 min, tiempo restante del token)

const verifyCache = new Map<string, CacheEntry>();

async function verifyPortalToken(token: string): Promise<PortalUser> {
  const now = Date.now();

  const cached = verifyCache.get(token);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  let fetchRes: Awaited<ReturnType<typeof fetch>>;
  try {
    fetchRes = await fetch(`${PORTAL_API}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new UnauthorizedError("Error al contactar el servicio de autenticación");
  }

  if (fetchRes.status === 401) {
    throw new UnauthorizedError("Token inválido o expirado");
  }

  if (!fetchRes.ok) {
    throw new UnauthorizedError("Error al verificar el token");
  }

  const body = (await fetchRes.json()) as { valid: boolean; user: PortalUser };
  const { user } = body;

  const tokenExp = user.exp * 1000;
  const fiveMin = now + 5 * 60 * 1000;
  const expiresAt = Math.min(tokenExp, fiveMin);

  verifyCache.set(token, { user, expiresAt });
  return user;
}

// ── Middlewares ───────────────────────────────────────────────────────────────

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Token de autenticación requerido"));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const user = await verifyPortalToken(token);
    req.auth = {
      userId: user.user_id,
      companyId: user.company_id,
      planId: user.plan_id,
      role: user.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdminRole(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth || req.auth.role !== "ADMIN") {
    next(new ForbiddenError("Se requiere rol ADMIN"));
    return;
  }
  next();
}

// Aliases para compatibilidad con imports existentes
export const requireSuperAdmin = requireAdminRole;
export const requireAdminEmpresa = requireAdminRole;
