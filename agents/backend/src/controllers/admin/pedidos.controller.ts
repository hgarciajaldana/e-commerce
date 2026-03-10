import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { NotFoundError, AppError } from "../../utils/errors";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import { auditLog } from "../../utils/audit";

const VALID_ESTADOS = [
  "pendiente",
  "confirmado",
  "procesando",
  "enviado",
  "entregado",
  "cancelado",
] as const;

const PedidosQuerySchema = z.object({
  estado: z.enum(VALID_ESTADOS).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const UpdateEstadoSchema = z.object({
  estado: z.enum(VALID_ESTADOS),
});

// ── GET /admin/pedidos ────────────────────────────────────────────────────
export async function listPedidos(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const query = PedidosQuerySchema.parse(req.query);
    const pagination = parsePagination(query);

    const where: Record<string, unknown> = { empresa_id: empresaId };
    if (query.estado) where.estado = query.estado;

    const [raw, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: getSkip(pagination),
        take: pagination.limit,
      }),
      prisma.pedido.count({ where }),
    ]);

    const data = raw.map((p) => ({
      ...p,
      numeroPedido: p.id.slice(-8).toUpperCase(),
      total: Number(p.total),
    }));

    res.json(buildPaginatedResult(data, total, pagination));
  } catch (err) {
    next(err);
  }
}

// ── GET /admin/pedidos/:id ────────────────────────────────────────────────
export async function getPedido(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const pedido = await prisma.pedido.findFirst({
      where: { id, empresa_id: empresaId },
    });

    if (!pedido) throw new NotFoundError("Pedido", id);

    res.json({
      data: {
        ...pedido,
        numeroPedido: pedido.id.slice(-8).toUpperCase(),
        total: Number(pedido.total),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /admin/pedidos/:id/estado ──────────────────────────────────────
export async function updateEstadoPedido(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = UpdateEstadoSchema.parse(req.body);

    const pedido = await prisma.pedido.findFirst({
      where: { id, empresa_id: empresaId },
    });
    if (!pedido) throw new NotFoundError("Pedido", id);

    const updated = await prisma.pedido.update({
      where: { id },
      data: { estado: body.estado },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "Pedido",
      recursoId: id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { estadoAnterior: pedido.estado, estadoNuevo: body.estado },
    });

    res.json({
      data: {
        ...updated,
        numeroPedido: updated.id.slice(-8).toUpperCase(),
        total: Number(updated.total),
      },
    });
  } catch (err) {
    next(err);
  }
}
