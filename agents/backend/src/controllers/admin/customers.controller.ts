import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../utils/errors";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import { auditLog } from "../../utils/audit";

const UpdateClienteSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().nullable(),
  notas: z.string().max(1000).optional().nullable(),
});

const CustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  busqueda: z.string().optional(),
});

export async function listCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const query = CustomersQuerySchema.parse(req.query);
    const pagination = parsePagination(query);

    const where: Record<string, unknown> = {
      empresa_id: empresaId,
      deleted_at: null,
    };

    if (query.busqueda) {
      where.OR = [
        { nombre: { contains: query.busqueda, mode: "insensitive" } },
        { telefono: { contains: query.busqueda } },
        { email: { contains: query.busqueda, mode: "insensitive" } },
      ];
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: getSkip(pagination),
        take: pagination.limit,
      }),
      prisma.cliente.count({ where }),
    ]);

    // Enrich with order counts per customer
    const phones = clientes.map((c) => c.telefono);
    const orderStats =
      phones.length > 0
        ? await prisma.pedido.groupBy({
            by: ["usuario_id"],
            where: {
              empresa_id: empresaId,
              usuario_id: { in: phones },
              deleted_at: null,
            },
            _count: { id: true },
            _sum: { total: true },
          })
        : [];

    const statsMap = new Map(
      orderStats.map((s) => [
        s.usuario_id,
        { totalPedidos: s._count.id, totalGastado: Number(s._sum.total ?? 0) },
      ])
    );

    const data = clientes.map((c) => ({
      ...c,
      totalPedidos: statsMap.get(c.telefono)?.totalPedidos ?? 0,
      totalGastado: statsMap.get(c.telefono)?.totalGastado ?? 0,
    }));

    res.json(buildPaginatedResult(data, total, pagination));
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const cliente = await prisma.cliente.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!cliente) throw new NotFoundError("Cliente", id);

    // Load their orders
    const pedidos = await prisma.pedido.findMany({
      where: {
        empresa_id: empresaId,
        usuario_id: cliente.telefono,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
      include: {
        items: {
          where: { deleted_at: null },
          select: {
            id: true,
            cantidad: true,
            precio_unitario: true,
            subtotal: true,
            snapshot_variante: true,
          },
        },
      },
    });

    const totalGastado = pedidos.reduce((sum, p) => sum + Number(p.total), 0);

    res.json({
      data: {
        ...cliente,
        totalPedidos: pedidos.length,
        totalGastado,
        pedidos: pedidos.map((p) => ({
          ...p,
          total: Number(p.total),
          subtotal: Number(p.subtotal),
          descuento: Number(p.descuento),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = UpdateClienteSchema.parse(req.body);

    const cliente = await prisma.cliente.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!cliente) throw new NotFoundError("Cliente", id);

    const updated = await prisma.cliente.update({
      where: { id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.notas !== undefined && { notas: body.notas }),
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "Cliente",
      recursoId: id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: body,
    });

    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
}
