import { Request, Response, NextFunction } from "express";
import path from "path";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../utils/errors";
import { auditLog } from "../../utils/audit";
import { getPublicUrl } from "../../services/storageService";

async function getProductoOrFail(empresaId: string, productoId: string) {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, empresa_id: empresaId, deleted_at: null },
  });
  if (!producto) throw new NotFoundError("Producto", productoId);
  return producto;
}

export async function addImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id: productoId } = req.params as Record<string, string>;

    await getProductoOrFail(empresaId, productoId);

    // Determinar URL: archivo subido vs URL externa
    let imageUrl: string;

    if (req.file) {
      // Formato a) multipart/form-data con campo "imagen"
      const filename = path.basename(req.file.path);
      imageUrl = getPublicUrl(empresaId, filename);
    } else if (req.body?.url) {
      // Formato b) JSON body con campo "url"
      imageUrl = req.body.url as string;
    } else {
      throw new ValidationError(
        "Se requiere un archivo en el campo 'imagen' o una URL en el campo 'url'"
      );
    }

    // Verificar si hay imágenes existentes para determinar si es_principal
    const imagenesExistentes = await prisma.imagenProducto.count({
      where: { producto_id: productoId, empresa_id: empresaId, deleted_at: null },
    });

    const esPrincipal = imagenesExistentes === 0;

    // Calcular orden
    const maxOrden = await prisma.imagenProducto.aggregate({
      where: { producto_id: productoId, empresa_id: empresaId, deleted_at: null },
      _max: { orden: true },
    });
    const orden = (maxOrden._max.orden ?? -1) + 1;

    const imagen = await prisma.imagenProducto.create({
      data: {
        empresa_id: empresaId,
        producto_id: productoId,
        url: imageUrl,
        orden,
        es_principal: esPrincipal,
      },
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "CREATE",
      recurso: "ImagenProducto",
      recursoId: imagen.id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: { productoId, url: imageUrl, esPrincipal },
    });

    res.status(201).json(imagen);
  } catch (err) {
    next(err);
  }
}

export async function deleteImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { id: productoId, imageId } = req.params as Record<string, string>;

    await getProductoOrFail(empresaId, productoId);

    const imagen = await prisma.imagenProducto.findFirst({
      where: {
        id: imageId,
        producto_id: productoId,
        empresa_id: empresaId,
        deleted_at: null,
      },
    });
    if (!imagen) throw new NotFoundError("Imagen", imageId);

    await prisma.imagenProducto.update({
      where: { id: imageId },
      data: { deleted_at: new Date() },
    });

    // Si era la principal y hay otras, promover la siguiente
    if (imagen.es_principal) {
      const siguiente = await prisma.imagenProducto.findFirst({
        where: {
          producto_id: productoId,
          empresa_id: empresaId,
          deleted_at: null,
          NOT: { id: imageId },
        },
        orderBy: { orden: "asc" },
      });
      if (siguiente) {
        await prisma.imagenProducto.update({
          where: { id: siguiente.id },
          data: { es_principal: true },
        });
      }
    }

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "DELETE",
      recurso: "ImagenProducto",
      recursoId: imageId,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
