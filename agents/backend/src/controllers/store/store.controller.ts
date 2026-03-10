import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { NotFoundError, AppError } from "../../utils/errors";
import { parsePagination, buildPaginatedResult, getSkip } from "../../utils/pagination";
import { buildWhatsAppUrl, formatDecimal } from "../../utils/whatsapp";
import { ProductsQuerySchema } from "../../schemas/store/products.schema";
import { CheckoutBodySchema } from "../../schemas/store/checkout.schema";

// ============================================================
// CONFIG PÚBLICA
// ============================================================

export async function getPublicConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;

    const config = await prisma.configuracionEmpresa.findUnique({
      where: { empresa_id: empresaId },
    });

    const datos = (config?.datos_tienda as Record<string, unknown>) ?? {};

    res.json({
      data: {
        tituloTienda: (datos.tituloTienda as string) ?? req.tenant!.subdominio,
        descripcionTienda: (datos.descripcionTienda as string) ?? null,
        logoUrl: (datos.logoUrl as string) ?? null,
        bannerUrl: (datos.bannerUrl as string) ?? null,
        colorPrimario: (datos.colorPrimario as string) ?? "#7C3AED",
        colorSecundario: (datos.colorSecundario as string) ?? null,
        gradienteActivo: (datos.gradienteActivo as boolean) ?? false,
        gradienteAngulo: (datos.gradienteAngulo as number) ?? 135,
        monedaSimbolo: req.tenant!.monedaSimbolo,
        heroTitulo: (datos.heroTitulo as string) ?? null,
        heroSubtitulo: (datos.heroSubtitulo as string) ?? null,
        heroCtaTexto: (datos.heroCtaTexto as string) ?? null,
        heroCtaUrl: (datos.heroCtaUrl as string) ?? "/productos",
        heroTipo: (datos.heroTipo as string) ?? "color",
        heroTextPos: (datos.heroTextPos as string) ?? "center",
        promociones: (datos.promociones as unknown[]) ?? [],
        telefono: (datos.telefono as string) ?? null,
        emailContacto: (datos.emailContacto as string) ?? null,
        whatsappNumero: req.tenant!.whatsappNumero,
        direccion: (datos.direccion as string) ?? null,
        horario: (datos.horario as string) ?? null,
        instagram: (datos.instagram as string) ?? null,
        facebook: (datos.facebook as string) ?? null,
        tiktok: (datos.tiktok as string) ?? null,
        twitter: (datos.twitter as string) ?? null,
        youtube: (datos.youtube as string) ?? null,
        colorHeader: (datos.colorHeader as string) ?? null,
        colorFondo: (datos.colorFondo as string) ?? null,
        colorTexto: (datos.colorTexto as string) ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// CATEGORÍAS
// ============================================================

export async function listCategorias(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;

    const categorias = await prisma.categoria.findMany({
      where: { empresa_id: empresaId, deleted_at: null, padre_id: null },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        orden: true,
        subcategorias: {
          where: { deleted_at: null },
          orderBy: [{ orden: "asc" }, { nombre: "asc" }],
          select: { id: true, nombre: true, slug: true },
        },
      },
    });

    res.json({ data: categorias });
  } catch (err) {
    next(err);
  }
}

// ── Inline schemas ────────────────────────────────────────────────────────
const CreateCarritoSchema = z.object({
  usuarioId: z.string().min(1).max(200),
});

const AddItemSchema = z.object({
  varianteId: z.string().min(1),
  cantidad: z.number().int().min(1, "Cantidad mínima: 1"),
});

const UpdateItemSchema = z.object({
  cantidad: z.number().int().min(0, "Cantidad mínima: 0"),
});

// ── Helper: carrito con items ─────────────────────────────────────────────
async function fetchCarritoWithItems(empresaId: string, carritoId: string) {
  return prisma.carrito.findFirst({
    where: { id: carritoId, empresa_id: empresaId, deleted_at: null },
    include: {
      items: {
        where: { deleted_at: null },
        orderBy: { created_at: "asc" },
        include: {
          variante: {
            select: {
              id: true,
              nombre: true,
              precio: true,
              sku: true,
              activa: true,
              stock: true,
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  slug: true,
                  imagenes: {
                    where: { es_principal: true, deleted_at: null },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

// ============================================================
// CATÁLOGO
// ============================================================

export async function listProductos(
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
      activo: true,
      deleted_at: null,
    };

    if (query.categoriaId) where.categoria_id = query.categoriaId;
    if (query.destacado !== undefined) where.destacado = query.destacado;
    if (query.en_promocion !== undefined) where.en_promocion = query.en_promocion;
    if (query.busqueda) {
      where.nombre = { contains: query.busqueda, mode: "insensitive" };
    }

    const [raw, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        orderBy: [{ destacado: "desc" }, { created_at: "desc" }],
        skip: getSkip(pagination),
        take: pagination.limit,
        include: {
          imagenes: {
            where: { deleted_at: null },
            orderBy: [{ es_principal: "desc" }, { orden: "asc" }],
            take: 1,
            select: { id: true, url: true, es_principal: true, orden: true },
          },
          variantes: {
            where: { deleted_at: null, activa: true },
            select: { id: true, nombre: true, precio: true, stock: true },
          },
          categoria: {
            select: { id: true, nombre: true, slug: true },
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

export async function getProducto(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const id = String(req.params.id ?? req.params.slug);

    const producto = await prisma.producto.findFirst({
      where: {
        empresa_id: empresaId,
        activo: true,
        deleted_at: null,
        OR: [{ id }, { slug: id }],
      },
      include: {
        imagenes: {
          where: { deleted_at: null },
          orderBy: [{ es_principal: "desc" }, { orden: "asc" }],
        },
        variantes: {
          where: { deleted_at: null, activa: true },
          orderBy: { created_at: "asc" },
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
        variantes: producto.variantes.map((v) => ({
          ...v,
          precio: v.precio !== null ? Number(v.precio) : null,
          activo: v.activa,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// PROMOCIONES
// ============================================================

export async function getPromociones(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;

    const productos = await prisma.producto.findMany({
      where: {
        empresa_id: empresaId,
        en_promocion: true,
        activo: true,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
      include: {
        imagenes: {
          where: { deleted_at: null },
          orderBy: [{ es_principal: "desc" }, { orden: "asc" }],
          take: 1,
          select: { id: true, url: true, es_principal: true },
        },
        variantes: {
          where: { deleted_at: null, activa: true },
          select: { id: true, nombre: true, precio: true, stock: true },
        },
        categoria: {
          select: { id: true, nombre: true, slug: true },
        },
      },
    });

    const data = productos.map((p) => ({
      ...p,
      precio: Number(p.precio_base),
      imagenes: p.imagenes.map((img) => ({ ...img, esPrincipal: img.es_principal })),
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// COLECCIONES PÚBLICAS
// ============================================================

export async function listColeccionesPublicas(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;

    const colecciones = await prisma.coleccion.findMany({
      where: { empresa_id: empresaId, activa: true, deleted_at: null },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        slug: true,
        descripcion: true,
        imagen_url: true,
        orden: true,
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

export async function getColeccionPublica(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const slug = String(req.params.slug);

    const coleccion = await prisma.coleccion.findFirst({
      where: { empresa_id: empresaId, slug, activa: true, deleted_at: null },
    });

    if (!coleccion) throw new NotFoundError("Colección", slug);

    const items = await prisma.coleccionProducto.findMany({
      where: { coleccion_id: coleccion.id },
      orderBy: { orden: "asc" },
      include: {
        producto: {
          include: {
            imagenes: {
              where: { deleted_at: null },
              orderBy: [{ es_principal: "desc" }, { orden: "asc" }],
              take: 1,
              select: { id: true, url: true, es_principal: true },
            },
            variantes: {
              where: { deleted_at: null, activa: true },
              select: { id: true, nombre: true, precio: true, stock: true },
            },
          },
        },
      },
    });

    const productos = items
      .filter((item) => item.producto.activo && !item.producto.deleted_at)
      .map((item) => ({
        ...item.producto,
        precio: Number(item.producto.precio_base),
        imagenes: item.producto.imagenes.map((img) => ({
          ...img,
          esPrincipal: img.es_principal,
        })),
        orden: item.orden,
      }));

    res.json({
      data: {
        id: coleccion.id,
        nombre: coleccion.nombre,
        slug: coleccion.slug,
        descripcion: coleccion.descripcion,
        imagen_url: coleccion.imagen_url,
        productos,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// PROMOCIONES ESPECIALES (público)
// ============================================================

export async function listPromocionesEspeciales(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const now = new Date();

    const data = await prisma.promocionEspecial.findMany({
      where: {
        empresa_id: empresaId,
        activa: true,
        OR: [{ fecha_inicio: null }, { fecha_inicio: { lte: now } }],
        AND: [
          {
            OR: [{ fecha_fin: null }, { fecha_fin: { gte: now } }],
          },
        ],
      },
      orderBy: { created_at: "desc" },
    });

    const mapped = data.map((p) => ({
      ...p,
      precio_original: p.precio_original ? Number(p.precio_original) : null,
      precio_final: Number(p.precio_final),
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// CARRITO
// ============================================================

export async function createCarrito(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { usuarioId } = CreateCarritoSchema.parse(req.body);

    // Devolver carrito activo existente si lo hay
    const existing = await fetchCarritoWithItems(
      empresaId,
      (
        await prisma.carrito.findFirst({
          where: { empresa_id: empresaId, usuario_id: usuarioId, estado: "activo", deleted_at: null },
          select: { id: true },
        })
      )?.id ?? ""
    );

    if (existing) {
      res.json(existing);
      return;
    }

    const carrito = await prisma.carrito.create({
      data: { empresa_id: empresaId, usuario_id: usuarioId },
      include: { items: true },
    });

    res.status(201).json(carrito);
  } catch (err) {
    next(err);
  }
}

export async function getCarrito(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const id = String(req.params.id);

    const carrito = await fetchCarritoWithItems(empresaId, id);
    if (!carrito) throw new NotFoundError("Carrito", id);

    res.json(carrito);
  } catch (err) {
    next(err);
  }
}

export async function addItemToCarrito(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const id = String(req.params.id);
    const body = AddItemSchema.parse(req.body);

    const carrito = await prisma.carrito.findFirst({
      where: { id, empresa_id: empresaId, estado: "activo", deleted_at: null },
      select: { id: true },
    });
    if (!carrito) throw new NotFoundError("Carrito", id);

    const variante = await prisma.variante.findFirst({
      where: { id: body.varianteId, empresa_id: empresaId, activa: true, deleted_at: null },
    });
    if (!variante) throw new NotFoundError("Variante", body.varianteId);

    // Upsert: si el item fue eliminado (soft delete) lo restaura y acumula cantidad
    const existingAny = await prisma.carritoItem.findUnique({
      where: { carrito_id_variante_id: { carrito_id: id, variante_id: body.varianteId } },
    });

    let isNew = false;
    if (existingAny) {
      const newCantidad = existingAny.deleted_at
        ? body.cantidad
        : existingAny.cantidad + body.cantidad;
      await prisma.carritoItem.update({
        where: { id: existingAny.id },
        data: {
          cantidad: newCantidad,
          precio_unitario: variante.precio,
          deleted_at: null,
        },
      });
    } else {
      isNew = true;
      await prisma.carritoItem.create({
        data: {
          carrito_id: id,
          variante_id: body.varianteId,
          empresa_id: empresaId,
          cantidad: body.cantidad,
          precio_unitario: variante.precio,
        },
      });
    }

    const updated = await fetchCarritoWithItems(empresaId, id);
    res.status(isNew ? 201 : 200).json(updated);
  } catch (err) {
    next(err);
  }
}

export async function updateCarritoItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const id = String(req.params.id);
    const itemId = String(req.params.itemId);
    const { cantidad } = UpdateItemSchema.parse(req.body);

    const carrito = await prisma.carrito.findFirst({
      where: { id, empresa_id: empresaId, estado: "activo", deleted_at: null },
      select: { id: true },
    });
    if (!carrito) throw new NotFoundError("Carrito", id);

    const item = await prisma.carritoItem.findFirst({
      where: { id: itemId, carrito_id: id, deleted_at: null },
    });
    if (!item) throw new NotFoundError("Item de carrito", itemId);

    if (cantidad === 0) {
      await prisma.carritoItem.update({
        where: { id: itemId },
        data: { deleted_at: new Date() },
      });
    } else {
      await prisma.carritoItem.update({
        where: { id: itemId },
        data: { cantidad },
      });
    }

    const updated = await fetchCarritoWithItems(empresaId, id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function removeCarritoItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const id = String(req.params.id);
    const itemId = String(req.params.itemId);

    const carrito = await prisma.carrito.findFirst({
      where: { id, empresa_id: empresaId, estado: "activo", deleted_at: null },
      select: { id: true },
    });
    if (!carrito) throw new NotFoundError("Carrito", id);

    const item = await prisma.carritoItem.findFirst({
      where: { id: itemId, carrito_id: id, deleted_at: null },
    });
    if (!item) throw new NotFoundError("Item de carrito", itemId);

    await prisma.carritoItem.update({
      where: { id: itemId },
      data: { deleted_at: new Date() },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ============================================================
// CLIENTES
// ============================================================

export async function lookupCliente(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { email, telefono } = req.query as { email?: string; telefono?: string };

    if (!email && !telefono) {
      res.status(400).json({
        error: "BAD_REQUEST",
        message: "Se requiere al menos email o telefono como query param",
      });
      return;
    }

    const orClauses: { empresa_id: string; email?: string; telefono?: string }[] = [];
    if (email) orClauses.push({ empresa_id: empresaId, email });
    if (telefono) orClauses.push({ empresa_id: empresaId, telefono });

    const cliente = await prisma.cliente.findFirst({
      where: { empresa_id: empresaId, OR: orClauses },
      select: { id: true, nombre: true, telefono: true, email: true },
    });

    if (!cliente) {
      res.status(404).json({ error: "NOT_FOUND", message: "Cliente no encontrado" });
      return;
    }

    res.json({ data: cliente });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// CHECKOUT
// ============================================================

export async function checkoutWhatsapp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const { whatsappNumero, mensajeTemplate, monedaSimbolo } = req.tenant!;

    const body = CheckoutBodySchema.parse(req.body);

    if (!whatsappNumero) {
      throw new AppError(
        422,
        "WHATSAPP_NOT_CONFIGURED",
        "La tienda no tiene número de WhatsApp configurado"
      );
    }
    const varianteIds = body.items.map((i) => i.varianteId);

    // Resolver variantes
    const variantes = await prisma.variante.findMany({
      where: {
        id: { in: varianteIds },
        empresa_id: empresaId,
        activa: true,
        deleted_at: null,
      },
      include: {
        producto: { select: { nombre: true, slug: true } },
      },
    });

    if (variantes.length !== varianteIds.length) {
      const foundIds = new Set(variantes.map((v) => v.id));
      const missing = varianteIds.filter((vid) => !foundIds.has(vid));
      throw new AppError(
        422,
        "VARIANTES_NOT_FOUND",
        `Variantes no encontradas o inactivas: ${missing.join(", ")}`
      );
    }

    const varianteMap = new Map(variantes.map((v) => [v.id, v]));

    // Calcular montos
    let subtotalNum = 0;
    const lineItems = body.items.map((item) => {
      const variante = varianteMap.get(item.varianteId)!;
      const precioUnitario = Number(variante.precio);
      const subtotal = precioUnitario * item.cantidad;
      subtotalNum += subtotal;
      return { ...item, variante, precioUnitario, subtotal };
    });

    const totalNum = subtotalNum;

    // Upsert cliente (non-fatal)
    prisma.cliente.upsert({
      where: { empresa_id_telefono: { empresa_id: empresaId, telefono: body.clienteTelefono } },
      update: { nombre: body.clienteNombre, email: body.clienteEmail ?? undefined },
      create: { empresa_id: empresaId, telefono: body.clienteTelefono, nombre: body.clienteNombre, email: body.clienteEmail ?? null },
    }).catch(() => {});

    // Serializar items para almacenar como JSON
    const itemsJson = lineItems.map((li) => ({
      varianteId: li.varianteId,
      nombre: li.variante.producto.nombre,
      variante: li.variante.nombre,
      sku: li.variante.sku,
      precioUnitario: li.precioUnitario,
      cantidad: li.cantidad,
      subtotal: li.subtotal,
    }));

    // Crear pedido en DB con los campos del esquema Prisma
    const pedido = await prisma.pedido.create({
      data: {
        empresa_id: empresaId,
        cliente_nombre: body.clienteNombre,
        cliente_email: body.clienteEmail ?? null,
        cliente_telefono: body.clienteTelefono,
        cliente_direccion: body.clienteDireccion ?? null,
        notas: body.notas ?? null,
        items: itemsJson,
        total: totalNum,
        estado: "pendiente",
        whatsapp_enviado: true,
      },
    });

    // Construir URL de WhatsApp
    const numeroPedido = pedido.id.slice(-8).toUpperCase();
    const whatsappItems = lineItems.map((li) => ({
      nombreProducto: li.variante.producto.nombre,
      nombreVariante: li.variante.nombre === "Default" ? null : li.variante.nombre,
      cantidad: li.cantidad,
      subtotal: formatDecimal(li.subtotal),
    }));

    const whatsappUrl = buildWhatsAppUrl(whatsappNumero, {
      numeroPedido,
      items: whatsappItems,
      total: formatDecimal(totalNum),
      subtotal: formatDecimal(subtotalNum),
      simbolo: monedaSimbolo,
      clienteNombre: body.clienteNombre,
      clienteTelefono: body.clienteTelefono,
      notas: body.notas ?? null,
      mensajeTemplate: mensajeTemplate ?? null,
    });

    res.status(201).json({
      pedidoId: pedido.id,
      numeroPedido,
      whatsappUrl,
      total: formatDecimal(totalNum),
      subtotal: formatDecimal(subtotalNum),
      simbolo: monedaSimbolo,
      items: lineItems.map((li) => ({
        varianteId: li.varianteId,
        nombreProducto: li.variante.producto.nombre,
        nombreVariante: li.variante.nombre === "Default" ? null : li.variante.nombre,
        cantidad: li.cantidad,
        precioUnitario: formatDecimal(li.precioUnitario),
        subtotal: formatDecimal(li.subtotal),
      })),
    });
  } catch (err) {
    next(err);
  }
}
