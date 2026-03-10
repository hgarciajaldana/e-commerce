import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ConflictError, OccConflictError } from "../../utils/errors";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import { auditLog } from "../../utils/audit";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoriesQuerySchema,
} from "../../schemas/admin/categories.schema";

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

async function ensureUniqueSlug(
  empresaId: string,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const existing = await prisma.categoria.findFirst({
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

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const query = CategoriesQuerySchema.parse(req.query);
    const pagination = parsePagination(query);

    // activo=true → solo no eliminadas; activo=false → solo eliminadas; sin filtro → no eliminadas
    const deletedAtFilter =
      query.activo === false ? { not: null as Date | null } : null;

    const where = {
      empresa_id: empresaId,
      deleted_at: deletedAtFilter ?? null,
    };

    const [data, total] = await Promise.all([
      prisma.categoria.findMany({
        where,
        orderBy: [{ orden: "asc" }, { nombre: "asc" }],
        skip: getSkip(pagination),
        take: pagination.limit,
      }),
      prisma.categoria.count({ where }),
    ]);

    res.json(buildPaginatedResult(data, total, pagination));
  } catch (err) {
    next(err);
  }
}

export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const body = CreateCategorySchema.parse(req.body);

    // RN: nombre único por empresa (case-insensitive)
    const nombreExistente = await prisma.categoria.findFirst({
      where: {
        empresa_id: empresaId,
        nombre: { mode: "insensitive", equals: body.nombre },
        deleted_at: null,
      },
    });
    if (nombreExistente) {
      throw new ConflictError(`Ya existe una categoría con el nombre '${body.nombre}'`);
    }

    const baseSlug = slugify(body.nombre);
    const slug = await ensureUniqueSlug(empresaId, baseSlug);

    const categoria = await prisma.categoria.create({
      data: {
        empresa_id: empresaId,
        nombre: body.nombre,
        slug,
        descripcion: body.descripcion ?? null,
        orden: body.orden ?? 0,
        padre_id: body.padreId ?? null,
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "Categoria",
      recursoId: categoria.id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { nombre: body.nombre, slug },
    });

    res.status(201).json({ data: categoria });
  } catch (err) {
    next(err);
  }
}

export async function getCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const categoria = await prisma.categoria.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
      include: {
        subcategorias: {
          where: { deleted_at: null },
          select: { id: true, nombre: true, slug: true, orden: true },
        },
        padre: {
          select: { id: true, nombre: true, slug: true },
        },
      },
    });

    if (!categoria) throw new NotFoundError("Categoría", id);

    res.json({ data: categoria });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;
    const body = UpdateCategorySchema.parse(req.body);

    const categoria = await prisma.categoria.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!categoria) throw new NotFoundError("Categoría", id);

    // OCC: verificar versión
    if (body.version !== categoria.version) {
      throw new OccConflictError("Categoría");
    }

    // nombre único si cambia
    if (body.nombre) {
      const nombreExistente = await prisma.categoria.findFirst({
        where: {
          empresa_id: empresaId,
          nombre: { mode: "insensitive", equals: body.nombre },
          deleted_at: null,
          NOT: { id },
        },
      });
      if (nombreExistente) {
        throw new ConflictError(`Ya existe una categoría con el nombre '${body.nombre}'`);
      }
    }

    const updateData: Record<string, unknown> = {
      version: categoria.version + 1,
    };
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion;
    if (body.orden !== undefined) updateData.orden = body.orden;
    if (body.padreId !== undefined) updateData.padre_id = body.padreId;
    // body.activo no tiene campo en DB — soft delete es el mecanismo de desactivación

    const updated = await prisma.categoria.update({
      where: { id },
      data: updateData,
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "Categoria",
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

export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id } = req.params as Record<string, string>;

    const categoria = await prisma.categoria.findFirst({
      where: { id, empresa_id: empresaId, deleted_at: null },
    });
    if (!categoria) throw new NotFoundError("Categoría", id);

    await prisma.categoria.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      recurso: "Categoria",
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
