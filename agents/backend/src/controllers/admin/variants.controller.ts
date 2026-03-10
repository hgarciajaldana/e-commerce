import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { auditLog } from "../../utils/audit";
import {
  CreateVariantSchema,
  UpdateVariantSchema,
} from "../../schemas/admin/variants.schema";

// Variante usa pessimistic locking según el schema (no tiene campo version en DB).
// El campo version del UpdateVariantSchema se acepta en el body pero no se usa para OCC.

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getProductoOrFail(empresaId: string, productoId: string) {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, empresa_id: empresaId, deleted_at: null },
  });
  if (!producto) throw new NotFoundError("Producto", productoId);
  return producto;
}

export async function listVariants(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id: productoId } = req.params as Record<string, string>;

    await getProductoOrFail(empresaId, productoId);

    const variantes = await prisma.variante.findMany({
      where: { producto_id: productoId, empresa_id: empresaId, deleted_at: null },
      orderBy: { created_at: "asc" },
    });

    res.json({ data: variantes });
  } catch (err) {
    next(err);
  }
}

export async function createVariant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id: productoId } = req.params as Record<string, string>;
    const body = CreateVariantSchema.parse(req.body);

    const producto = await getProductoOrFail(empresaId, productoId);

    // RN-035: SKU único por empresa
    const sku = body.sku ?? `${slugify(producto.nombre)}-${uuidv4().slice(0, 8)}`;

    const skuExistente = await prisma.variante.findFirst({
      where: { empresa_id: empresaId, sku, deleted_at: null },
    });
    if (skuExistente) {
      throw new ConflictError(`Ya existe una variante con el SKU '${sku}'`);
    }

    const variante = await prisma.variante.create({
      data: {
        empresa_id: empresaId,
        producto_id: productoId,
        nombre: body.nombre,
        sku,
        precio: body.precio ?? producto.precio_base,
        stock: body.stock ?? 0,
        atributos: (body.atributos ?? undefined) as any,
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "Variante",
      recursoId: variante.id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { productoId, sku, nombre: body.nombre },
    });

    res.status(201).json({ data: variante });
  } catch (err) {
    next(err);
  }
}

export async function updateVariant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id: productoId, variantId } = req.params as Record<string, string>;
    const body = UpdateVariantSchema.parse(req.body);

    await getProductoOrFail(empresaId, productoId);

    const variante = await prisma.variante.findFirst({
      where: { id: variantId, producto_id: productoId, empresa_id: empresaId, deleted_at: null },
    });
    if (!variante) throw new NotFoundError("Variante", variantId);

    // Usar transacción para consistencia (pessimistic approach según schema)
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (body.nombre !== undefined) updateData.nombre = body.nombre;
      if (body.precio !== undefined) updateData.precio = body.precio;
      if (body.stock !== undefined) updateData.stock = body.stock;
      if (body.activa !== undefined) updateData.activa = body.activa;
      if (body.atributos !== undefined) updateData.atributos = body.atributos;

      return tx.variante.update({
        where: { id: variantId },
        data: updateData,
      });
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "Variante",
      recursoId: variantId,
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

export async function deleteVariant(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id: productoId, variantId } = req.params as Record<string, string>;

    await getProductoOrFail(empresaId, productoId);

    const variante = await prisma.variante.findFirst({
      where: { id: variantId, producto_id: productoId, empresa_id: empresaId, deleted_at: null },
    });
    if (!variante) throw new NotFoundError("Variante", variantId);

    await prisma.variante.update({
      where: { id: variantId },
      data: { deleted_at: new Date() },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      recurso: "Variante",
      recursoId: variantId,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
