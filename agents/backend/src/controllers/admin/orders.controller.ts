import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError, AppError } from "../../utils/errors";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import { auditLog } from "../../utils/audit";
import {
  OrdersQuerySchema,
  UpdateOrderStatusSchema,
  VALID_TRANSITIONS,
} from "../../schemas/admin/orders.schema";

export async function listOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const query = OrdersQuerySchema.parse(req.query);
    const pagination = parsePagination(query);

    const where: Record<string, unknown> = { empresa_id: empresaId };

    if (query.estado) where.estado = query.estado;

    if (query.fechaDesde || query.fechaHasta) {
      const created_at: Record<string, Date> = {};
      if (query.fechaDesde) created_at.gte = new Date(query.fechaDesde);
      if (query.fechaHasta) created_at.lte = new Date(query.fechaHasta);
      where.created_at = created_at;
    }

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
      id: p.id,
      numeroPedido: p.id.slice(-8).toUpperCase(),
      clienteNombre: p.cliente_nombre,
      clienteEmail: p.cliente_email,
      clienteTelefono: p.cliente_telefono,
      clienteDireccion: p.cliente_direccion,
      notas: p.notas,
      items: p.items,
      total: Number(p.total),
      estado: p.estado,
      whatsappEnviado: p.whatsapp_enviado,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    res.json(buildPaginatedResult(data, total, pagination));
  } catch (err) {
    next(err);
  }
}

export async function getOrder(
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
        id: pedido.id,
        numeroPedido: pedido.id.slice(-8).toUpperCase(),
        clienteNombre: pedido.cliente_nombre,
        clienteEmail: pedido.cliente_email,
        clienteTelefono: pedido.cliente_telefono,
        clienteDireccion: pedido.cliente_direccion,
        notas: pedido.notas,
        items: pedido.items,
        total: Number(pedido.total),
        estado: pedido.estado,
        whatsappEnviado: pedido.whatsapp_enviado,
        createdAt: pedido.created_at,
        updatedAt: pedido.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = UpdateOrderStatusSchema.parse(req.body);

    const pedido = await prisma.pedido.findFirst({
      where: { id, empresa_id: empresaId },
    });
    if (!pedido) throw new NotFoundError("Pedido", id);

    const allowedNextStates = VALID_TRANSITIONS[pedido.estado] ?? [];
    if (!allowedNextStates.includes(body.estado)) {
      throw new AppError(
        422,
        "INVALID_TRANSITION",
        `No se puede pasar de '${pedido.estado}' a '${body.estado}'. Transiciones válidas: ${
          allowedNextStates.length ? allowedNextStates.join(", ") : "ninguna"
        }`
      );
    }

    const updated = await prisma.pedido.update({
      where: { id },
      data: {
        estado: body.estado,
        notas: body.notas !== undefined ? body.notas : pedido.notas,
      },
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
        id: updated.id,
        numeroPedido: updated.id.slice(-8).toUpperCase(),
        clienteNombre: updated.cliente_nombre,
        clienteEmail: updated.cliente_email,
        clienteTelefono: updated.cliente_telefono,
        clienteDireccion: updated.cliente_direccion,
        notas: updated.notas,
        items: updated.items,
        total: Number(updated.total),
        estado: updated.estado,
        whatsappEnviado: updated.whatsapp_enviado,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
}
