import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { auditLog } from "../../utils/audit";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import {
  CreatePromocionSchema,
  UpdatePromocionSchema,
} from "../../schemas/admin/promociones.schema";

// ── GET / — lista paginada de promociones ─────────────────────────────────────

export async function listPromociones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { activa, page, limit } = req.query as Record<string, string | undefined>;
    const pagination = parsePagination({ page, limit });

    const where: Record<string, unknown> = { empresa_id: empresaId };
    if (activa !== undefined) where.activa = activa === "true";

    const [data, total] = await prisma.$transaction([
      prisma.promocionEspecial.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: getSkip(pagination),
        take: pagination.limit,
      }),
      prisma.promocionEspecial.count({ where }),
    ]);

    const mapped = data.map((p) => ({
      ...p,
      precio_original: p.precio_original ? Number(p.precio_original) : null,
      precio_final: Number(p.precio_final),
    }));

    res.json(buildPaginatedResult(mapped, total, pagination));
  } catch (err) {
    next(err);
  }
}

// ── GET /:id — detalle ────────────────────────────────────────────────────────

export async function getPromocion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const promo = await prisma.promocionEspecial.findFirst({
      where: { id, empresa_id: empresaId },
    });

    if (!promo) throw new NotFoundError("PromocionEspecial", id);

    res.json({
      data: {
        ...promo,
        precio_original: promo.precio_original ? Number(promo.precio_original) : null,
        precio_final: Number(promo.precio_final),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST / — crear ────────────────────────────────────────────────────────────

export async function createPromocion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const body = CreatePromocionSchema.parse(req.body);

    const promo = await prisma.promocionEspecial.create({
      data: {
        empresa_id: empresaId,
        nombre: body.nombre,
        descripcion: body.descripcion ?? null,
        imagen_url: body.imagen_url ?? null,
        tipo: body.tipo,
        compra_cantidad: body.compra_cantidad ?? null,
        llevas_cantidad: body.llevas_cantidad ?? null,
        porcentaje: body.porcentaje ?? null,
        precio_original: body.precio_original ?? null,
        precio_final: body.precio_final,
        productos_ids: body.productos_ids ?? null,
        activa: body.activa ?? true,
        fecha_inicio: body.fecha_inicio ? new Date(body.fecha_inicio) : null,
        fecha_fin: body.fecha_fin ? new Date(body.fecha_fin) : null,
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "PromocionEspecial",
      recursoId: promo.id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { nombre: body.nombre, tipo: body.tipo },
    });

    res.status(201).json({
      data: {
        ...promo,
        precio_original: promo.precio_original ? Number(promo.precio_original) : null,
        precio_final: Number(promo.precio_final),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PUT /:id — actualizar con control de versión ──────────────────────────────

export async function updatePromocion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = UpdatePromocionSchema.parse(req.body);

    const existing = await prisma.promocionEspecial.findFirst({
      where: { id, empresa_id: empresaId },
    });
    if (!existing) throw new NotFoundError("PromocionEspecial", id);

    if (existing.version !== body.version) {
      throw new ConflictError(
        `Conflicto de versión: la promoción fue modificada (versión actual: ${existing.version})`
      );
    }

    const updateData: Record<string, unknown> = { version: existing.version + 1 };
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.imagen_url !== undefined) updateData.imagen_url = body.imagen_url;
    if (body.tipo !== undefined) updateData.tipo = body.tipo;
    if (body.compra_cantidad !== undefined) updateData.compra_cantidad = body.compra_cantidad;
    if (body.llevas_cantidad !== undefined) updateData.llevas_cantidad = body.llevas_cantidad;
    if (body.porcentaje !== undefined) updateData.porcentaje = body.porcentaje;
    if (body.precio_original !== undefined) updateData.precio_original = body.precio_original;
    if (body.precio_final !== undefined) updateData.precio_final = body.precio_final;
    if (body.productos_ids !== undefined) updateData.productos_ids = body.productos_ids;
    if (body.activa !== undefined) updateData.activa = body.activa;
    if (body.fecha_inicio !== undefined) {
      updateData.fecha_inicio = body.fecha_inicio ? new Date(body.fecha_inicio) : null;
    }
    if (body.fecha_fin !== undefined) {
      updateData.fecha_fin = body.fecha_fin ? new Date(body.fecha_fin) : null;
    }

    const updated = await prisma.promocionEspecial.update({
      where: { id },
      data: updateData,
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "PromocionEspecial",
      recursoId: id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: body,
    });

    res.json({
      data: {
        ...updated,
        precio_original: updated.precio_original ? Number(updated.precio_original) : null,
        precio_final: Number(updated.precio_final),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /:id — eliminar ────────────────────────────────────────────────────

export async function deletePromocion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const existing = await prisma.promocionEspecial.findFirst({
      where: { id, empresa_id: empresaId },
    });
    if (!existing) throw new NotFoundError("PromocionEspecial", id);

    await prisma.promocionEspecial.delete({ where: { id } });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      recurso: "PromocionEspecial",
      recursoId: id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
