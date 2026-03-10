import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import { auditLog } from "../../utils/audit";
import {
  CreateEmpresaSchema,
  EmpresasQuerySchema,
} from "../../schemas/superadmin/empresas.schema";

export async function createEmpresa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = CreateEmpresaSchema.parse(req.body);

    const existente = await prisma.empresa.findFirst({
      where: { subdominio: body.subdominio, deleted_at: null },
    });
    if (existente) {
      throw new ConflictError(`Ya existe una empresa con el subdominio '${body.subdominio}'`);
    }

    const existenteNit = await prisma.empresa.findFirst({
      where: { nit: body.nit, deleted_at: null },
    });
    if (existenteNit) {
      throw new ConflictError(`Ya existe una empresa con el NIT '${body.nit}'`);
    }

    if (body.portal_company_id) {
      const existentePortal = await prisma.empresa.findFirst({
        where: { portal_company_id: body.portal_company_id, deleted_at: null },
      });
      if (existentePortal) {
        throw new ConflictError(`Ya existe una empresa vinculada a ese portal_company_id`);
      }
    }

    const emp = await prisma.empresa.create({
      data: {
        nombre: body.nombre,
        nit: body.nit,
        subdominio: body.subdominio,
        portal_company_id: body.portal_company_id ?? null,
        plan: body.plan ?? "basic",
      },
    });

    try {
      await prisma.configuracionEmpresa.create({
        data: {
          empresa_id: emp.id,
          moneda: "ARS",
          idioma: "es",
          datos_tienda: (body.configuracion ?? {}) as any,
        },
      });
    } catch (configErr) {
      await prisma.empresa.delete({ where: { id: emp.id } });
      throw configErr;
    }

    const empresaCompleta = await prisma.empresa.findUnique({
      where: { id: emp.id },
      include: { configuracion: true },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "Empresa",
      recursoId: emp.id,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { nombre: body.nombre, subdominio: body.subdominio, plan: body.plan },
    });

    res.status(201).json(empresaCompleta);
  } catch (err) {
    next(err);
  }
}

export async function listEmpresas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = EmpresasQuerySchema.parse(req.query);
    const pagination = parsePagination(query);

    const where: Record<string, unknown> = { deleted_at: null };
    if (query.activa !== undefined) where.activa = query.activa;

    const [data, total] = await Promise.all([
      prisma.empresa.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: getSkip(pagination),
        take: pagination.limit,
        include: {
          configuracion: {
            select: { moneda: true, idioma: true, datos_tienda: true },
          },
          _count: { select: { admins: true, productos: true } },
        },
      }),
      prisma.empresa.count({ where }),
    ]);

    res.json(buildPaginatedResult(data, total, pagination));
  } catch (err) {
    next(err);
  }
}

export async function getEmpresa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;

    const empresa = await prisma.empresa.findFirst({
      where: { id, deleted_at: null },
      include: {
        configuracion: true,
        _count: { select: { admins: true, productos: true, pedidos: true } },
      },
    });

    if (!empresa) throw new NotFoundError("Empresa", id);

    res.json(empresa);
  } catch (err) {
    next(err);
  }
}

export async function activarEmpresa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;

    const empresa = await prisma.empresa.findFirst({ where: { id, deleted_at: null } });
    if (!empresa) throw new NotFoundError("Empresa", id);

    const updated = await prisma.empresa.update({ where: { id }, data: { activa: true } });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "ACTIVATE",
      recurso: "Empresa",
      recursoId: id,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { subdominio: empresa.subdominio },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function desactivarEmpresa(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as Record<string, string>;

    const empresa = await prisma.empresa.findFirst({ where: { id, deleted_at: null } });
    if (!empresa) throw new NotFoundError("Empresa", id);

    const updated = await prisma.empresa.update({ where: { id }, data: { activa: false } });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DEACTIVATE",
      recurso: "Empresa",
      recursoId: id,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { subdominio: empresa.subdominio },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
