import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError, OccConflictError } from "../../utils/errors";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import { auditLog } from "../../utils/audit";
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductsQuerySchema,
} from "../../schemas/admin/products.schema";

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

async function ensureUniqueProductSlug(
  empresaId: string,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const existing = await prisma.producto.findFirst({
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

async function ensureUniqueSku(
  empresaId: string,
  sku: string,
  excludeVarianteId?: string
): Promise<void> {
  const existing = await prisma.variante.findFirst({
    where: {
      empresa_id: empresaId,
      sku,
      deleted_at: null,
      ...(excludeVarianteId ? { NOT: { id: excludeVarianteId } } : {}),
    },
  });
  if (existing) {
    throw new ConflictError(`Ya existe una variante con el SKU '${sku}'`);
  }
}

export async function listProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const query = ProductsQuerySchema.parse(req.query);
    const pagination = parsePagination(query);

    const where: Record<string, unknown> = {
      empresa_id: empresaId,
      deleted_at: null,
    };

    if (query.categoriaId) where.categoria_id = query.categoriaId;
    if (query.activo !== undefined) where.activo = query.activo;
    if (query.busqueda) {
      where.nombre = { contains: query.busqueda, mode: "insensitive" };
    }

    const [raw, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: getSkip(pagination),
        take: pagination.limit,
        include: {
          imagenes: {
            where: { deleted_at: null },
            orderBy: [{ es_principal: "desc" }, { orden: "asc" }],
            take: 1,
            select: { id: true, url: true, es_principal: true },
          },
          variantes: {
            where: { deleted_at: null, activa: true },
            select: { id: true, nombre: true, sku: true, precio: true, stock: true },
          },
        },
      }),
      prisma.producto.count({ where }),
    ]);

    const data = raw.map((p) => ({
      ...p,
      precio: Number(p.precio_base),
      imagenes: p.imagenes.map((img) => ({ ...img, esPrincipal: img.es_principal })),
    }));

    res.json(buildPaginatedResult(data, total, pagination));
  } catch (err) {
    next(err);
  }
}

export async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const body = CreateProductSchema.parse(req.body);

    // RN-032: nombre único por empresa (case-insensitive)
    const nombreExistente = await prisma.producto.findFirst({
      where: {
        empresa_id: empresaId,
        nombre: { mode: "insensitive", equals: body.nombre },
        deleted_at: null,
      },
    });
    if (nombreExistente) {
      throw new ConflictError(`Ya existe un producto con el nombre '${body.nombre}'`);
    }

    const baseSlug = slugify(body.nombre);
    const slug = await ensureUniqueProductSlug(empresaId, baseSlug);

    // Validar SKUs únicos si se pasan variantes
    if (body.variantes?.length) {
      for (const v of body.variantes) {
        if (v.sku) await ensureUniqueSku(empresaId, v.sku);
      }
    }

    const producto = await prisma.$transaction(async (tx) => {
      const prod = await tx.producto.create({
        data: {
          empresa_id: empresaId,
          nombre: body.nombre,
          slug,
          descripcion: body.descripcion ?? null,
          precio_base: body.precio,
          categoria_id: body.categoriaId ?? null,
          destacado: body.destacado ?? false,
          en_promocion: body.en_promocion ?? false,
        },
      });

      // Crear variantes o variante default
      if (body.variantes?.length) {
        await tx.variante.createMany({
          data: body.variantes.map((v) => ({
            empresa_id: empresaId,
            producto_id: prod.id,
            nombre: v.nombre,
            sku: v.sku ?? `${slugify(body.nombre)}-${uuidv4().slice(0, 8)}`,
            precio: v.precio ?? body.precio,
            stock: v.stock ?? 0,
          })),
        });
      } else {
        // Variante default — usa el stock del body si fue enviado
        await tx.variante.create({
          data: {
            empresa_id: empresaId,
            producto_id: prod.id,
            nombre: "Default",
            sku: `${slugify(body.nombre)}-${uuidv4().slice(0, 8)}`,
            precio: body.precio,
            stock: body.stock,
          },
        });
      }

      // Crear imágenes si se pasan
      if (body.imagenes?.length) {
        await tx.imagenProducto.createMany({
          data: body.imagenes.map((img, idx) => ({
            empresa_id: empresaId,
            producto_id: prod.id,
            url: img.url,
            orden: img.orden ?? idx,
            es_principal: idx === 0 ? true : (img.esPrincipal ?? false),
          })),
        });
      }

      return prod;
    });

    const productoCompleto = await prisma.producto.findFirst({
      where: { id: producto.id },
      include: {
        variantes: { where: { deleted_at: null } },
        imagenes: { where: { deleted_at: null }, orderBy: { orden: "asc" } },
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "Producto",
      recursoId: producto.id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { nombre: body.nombre, slug },
    });

    res.status(201).json({ data: productoCompleto });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const producto = await prisma.producto.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
      include: {
        variantes: {
          where: { deleted_at: null },
          orderBy: { created_at: "asc" },
        },
        imagenes: {
          where: { deleted_at: null },
          orderBy: [{ es_principal: "desc" }, { orden: "asc" }],
        },
        categoria: {
          select: { id: true, nombre: true, slug: true },
        },
      },
    });

    if (!producto) throw new NotFoundError("Producto", id);

    res.json({
      data: {
        ...producto,
        precio: Number(producto.precio_base),
        imagenes: producto.imagenes.map((img) => ({ ...img, esPrincipal: img.es_principal })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = UpdateProductSchema.parse(req.body);

    const producto = await prisma.producto.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!producto) throw new NotFoundError("Producto", id);

    // OCC: verificar versión
    if (body.version !== producto.version) {
      throw new OccConflictError("Producto");
    }

    // nombre único si cambia
    if (body.nombre) {
      const nombreExistente = await prisma.producto.findFirst({
        where: {
          empresa_id: empresaId,
          nombre: { mode: "insensitive", equals: body.nombre },
          deleted_at: null,
          NOT: { id },
        },
      });
      if (nombreExistente) {
        throw new ConflictError(`Ya existe un producto con el nombre '${body.nombre}'`);
      }
    }

    const updateData: Record<string, unknown> = {
      version: producto.version + 1,
    };
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.precio !== undefined) updateData.precio_base = body.precio;
    if (body.categoriaId !== undefined) updateData.categoria_id = body.categoriaId;
    if (body.activo !== undefined) updateData.activo = body.activo;
    if (body.destacado !== undefined) updateData.destacado = body.destacado;
    if (body.en_promocion !== undefined) updateData.en_promocion = body.en_promocion;

    const updated = await prisma.producto.update({
      where: { id },
      data: updateData,
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "Producto",
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

export async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const producto = await prisma.producto.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!producto) throw new NotFoundError("Producto", id);

    await prisma.producto.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      recurso: "Producto",
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
