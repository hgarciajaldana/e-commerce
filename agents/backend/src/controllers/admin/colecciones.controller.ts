import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { auditLog } from "../../utils/audit";
import {
  CreateColeccionSchema,
  UpdateColeccionSchema,
  AsignarProductoSchema,
} from "../../schemas/admin/colecciones.schema";

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

async function ensureUniqueColeccionSlug(
  empresaId: string,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const existing = await prisma.coleccion.findFirst({
      where: {
        empresa_id: empresaId,
        slug,
        deleted_at: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) break;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}

// ── GET / — lista colecciones con count de productos ─────────────────────────

export async function listColecciones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;

    const colecciones = await prisma.coleccion.findMany({
      where: { empresa_id: empresaId, deleted_at: null },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      include: {
        _count: { select: { productos: true } },
      },
    });

    const data = colecciones.map((c) => ({
      ...c,
      productosCount: c._count.productos,
      _count: undefined,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ── POST / — crear coleccion ──────────────────────────────────────────────────

export async function createColeccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const body = CreateColeccionSchema.parse(req.body);

    const nombreExistente = await prisma.coleccion.findFirst({
      where: {
        empresa_id: empresaId,
        nombre: { mode: "insensitive", equals: body.nombre },
        deleted_at: null,
      },
    });
    if (nombreExistente) {
      throw new ConflictError(`Ya existe una colección con el nombre '${body.nombre}'`);
    }

    const baseSlug = slugify(body.nombre);
    const slug = await ensureUniqueColeccionSlug(empresaId, baseSlug);

    const coleccion = await prisma.coleccion.create({
      data: {
        empresa_id: empresaId,
        nombre: body.nombre,
        slug,
        descripcion: body.descripcion ?? null,
        imagen_url: body.imagen_url ?? null,
        activa: body.activa ?? true,
        orden: body.orden ?? 0,
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "Coleccion",
      recursoId: coleccion.id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { nombre: body.nombre, slug },
    });

    res.status(201).json({ data: coleccion });
  } catch (err) {
    next(err);
  }
}

// ── GET /:id — detalle de coleccion ──────────────────────────────────────────

export async function getColeccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const coleccion = await prisma.coleccion.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
      include: {
        _count: { select: { productos: true } },
      },
    });

    if (!coleccion) throw new NotFoundError("Colección", id);

    res.json({
      data: {
        ...coleccion,
        productosCount: coleccion._count.productos,
        _count: undefined,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PUT /:id — actualizar coleccion ──────────────────────────────────────────

export async function updateColeccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = UpdateColeccionSchema.parse(req.body);

    const coleccion = await prisma.coleccion.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!coleccion) throw new NotFoundError("Colección", id);

    if (body.nombre) {
      const nombreExistente = await prisma.coleccion.findFirst({
        where: {
          empresa_id: empresaId,
          nombre: { mode: "insensitive", equals: body.nombre },
          deleted_at: null,
          NOT: { id },
        },
      });
      if (nombreExistente) {
        throw new ConflictError(`Ya existe una colección con el nombre '${body.nombre}'`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) {
      updateData.nombre = body.nombre;
      updateData.slug = await ensureUniqueColeccionSlug(
        empresaId,
        slugify(body.nombre),
        id
      );
    }
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.imagen_url !== undefined) updateData.imagen_url = body.imagen_url;
    if (body.activa !== undefined) updateData.activa = body.activa;
    if (body.orden !== undefined) updateData.orden = body.orden;

    const updated = await prisma.coleccion.update({
      where: { id },
      data: updateData,
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "Coleccion",
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

// ── DELETE /:id — eliminar coleccion (soft delete) ────────────────────────────

export async function deleteColeccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const coleccion = await prisma.coleccion.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!coleccion) throw new NotFoundError("Colección", id);

    await prisma.coleccion.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      recurso: "Coleccion",
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

// ── GET /:id/productos — lista productos de la coleccion ──────────────────────

export async function listProductosDeColeccion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const coleccion = await prisma.coleccion.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!coleccion) throw new NotFoundError("Colección", id);

    const items = await prisma.coleccionProducto.findMany({
      where: { coleccion_id: id },
      orderBy: { orden: "asc" },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            precio_base: true,
            activo: true,
            deleted_at: true,
            imagenes: {
              where: { deleted_at: null, es_principal: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    const data = items
      .filter((item) => item.producto.deleted_at === null)
      .map((item) => ({
        productoId: item.producto_id,
        orden: item.orden,
        producto: {
          ...item.producto,
          precio: Number(item.producto.precio_base),
          deleted_at: undefined,
        },
      }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ── POST /:id/productos — asignar producto a coleccion ────────────────────────

export async function asignarProducto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = AsignarProductoSchema.parse(req.body);

    const coleccion = await prisma.coleccion.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!coleccion) throw new NotFoundError("Colección", id);

    const producto = await prisma.producto.findFirst({
      where: { id: body.productoId, empresa_id: empresaId, deleted_at: null },
    });
    if (!producto) throw new NotFoundError("Producto", body.productoId);

    const existing = await prisma.coleccionProducto.findUnique({
      where: {
        coleccion_id_producto_id: {
          coleccion_id: id,
          producto_id: body.productoId,
        },
      },
    });
    if (existing) {
      throw new ConflictError("El producto ya está asignado a esta colección");
    }

    const item = await prisma.coleccionProducto.create({
      data: {
        coleccion_id: id,
        producto_id: body.productoId,
        orden: body.orden ?? 0,
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "ColeccionProducto",
      recursoId: `${id}:${body.productoId}`,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { coleccionId: id, productoId: body.productoId, orden: body.orden },
    });

    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /:id/productos/:productoId — quitar producto de coleccion ──────────

export async function quitarProducto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id, productoId } = req.params as Record<string, string>;

    const coleccion = await prisma.coleccion.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!coleccion) throw new NotFoundError("Colección", id);

    const item = await prisma.coleccionProducto.findUnique({
      where: {
        coleccion_id_producto_id: {
          coleccion_id: id,
          producto_id: productoId,
        },
      },
    });
    if (!item) throw new NotFoundError("Producto en colección", productoId);

    await prisma.coleccionProducto.delete({
      where: {
        coleccion_id_producto_id: {
          coleccion_id: id,
          producto_id: productoId,
        },
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      recurso: "ColeccionProducto",
      recursoId: `${id}:${productoId}`,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
