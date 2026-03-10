import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { OccConflictError } from "../../utils/errors";
import { auditLog } from "../../utils/audit";
import { UpdateStoreConfigSchema } from "../../schemas/admin/storeConfig.schema";

// Normaliza la fila de ConfiguracionEmpresa a una respuesta plana y coherente
function buildConfigResponse(config: {
  id: string;
  empresa_id: string;
  moneda: string;
  datos_tienda: unknown;
  version: number;
  updated_at: Date;
}) {
  const datos = (config.datos_tienda as Record<string, unknown>) ?? {};
  return {
    id: config.id,
    empresaId: config.empresa_id,
    moneda: config.moneda,
    monedaSimbolo: (datos.monedaSimbolo as string) ?? "$",
    whatsappNumero: (datos.whatsappNumero as string) ?? null,
    mensajeTemplate: (datos.mensajeTemplate as string) ?? null,
    colorPrimario: (datos.colorPrimario as string) ?? null,
    logoUrl: (datos.logoUrl as string) ?? null,
    bannerUrl: (datos.bannerUrl as string) ?? null,
    tituloTienda: (datos.tituloTienda as string) ?? null,
    descripcionTienda: (datos.descripcionTienda as string) ?? null,
    // Gradiente
    colorSecundario: (datos.colorSecundario as string) ?? null,
    gradienteActivo: (datos.gradienteActivo as boolean) ?? false,
    gradienteAngulo: (datos.gradienteAngulo as number) ?? 135,
    // Hero
    heroTitulo: (datos.heroTitulo as string) ?? null,
    heroSubtitulo: (datos.heroSubtitulo as string) ?? null,
    heroCtaTexto: (datos.heroCtaTexto as string) ?? null,
    heroCtaUrl: (datos.heroCtaUrl as string) ?? "/productos",
    heroTipo: (datos.heroTipo as string) ?? "color",
    heroTextPos: (datos.heroTextPos as string) ?? "center",
    // Promociones
    promociones: (datos.promociones as unknown[]) ?? [],
    // Contacto
    telefono: (datos.telefono as string) ?? null,
    emailContacto: (datos.emailContacto as string) ?? null,
    direccion: (datos.direccion as string) ?? null,
    horario: (datos.horario as string) ?? null,
    // Redes sociales
    instagram: (datos.instagram as string) ?? null,
    facebook: (datos.facebook as string) ?? null,
    tiktok: (datos.tiktok as string) ?? null,
    twitter: (datos.twitter as string) ?? null,
    youtube: (datos.youtube as string) ?? null,
    // Colores parametrizables
    colorHeader: datos.colorHeader ?? null,
    colorFondo: datos.colorFondo ?? null,
    colorTexto: datos.colorTexto ?? null,
    version: config.version,
    updatedAt: config.updated_at,
  };
}

export async function getStoreConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;

    let config = await prisma.configuracionEmpresa.findUnique({
      where: { empresa_id: empresaId },
    });

    if (!config) {
      config = await prisma.configuracionEmpresa.create({
        data: { empresa_id: empresaId },
      });
    }

    res.json({ data: buildConfigResponse(config) });
  } catch (err) {
    next(err);
  }
}

export async function updateStoreConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const empresaId = req.tenant!.empresaId;
    const body = UpdateStoreConfigSchema.parse(req.body);

    let config = await prisma.configuracionEmpresa.findUnique({
      where: { empresa_id: empresaId },
    });

    if (!config) {
      config = await prisma.configuracionEmpresa.create({
        data: { empresa_id: empresaId },
      });
    }

    if (body.version !== config.version) {
      throw new OccConflictError("ConfiguracionEmpresa");
    }

    const datosTiendaActual = (config.datos_tienda as Record<string, unknown>) ?? {};
    const datosNuevos: Record<string, unknown> = { ...datosTiendaActual };

    // Campos existentes
    if (body.whatsappNumero !== undefined) datosNuevos.whatsappNumero = body.whatsappNumero;
    if (body.mensajeTemplate !== undefined) datosNuevos.mensajeTemplate = body.mensajeTemplate;
    if (body.monedaSimbolo !== undefined) datosNuevos.monedaSimbolo = body.monedaSimbolo;
    if (body.colorPrimario !== undefined) datosNuevos.colorPrimario = body.colorPrimario;
    if (body.logoUrl !== undefined) datosNuevos.logoUrl = body.logoUrl;
    if (body.bannerUrl !== undefined) datosNuevos.bannerUrl = body.bannerUrl;
    if (body.tituloTienda !== undefined) datosNuevos.tituloTienda = body.tituloTienda;
    if (body.descripcionTienda !== undefined) datosNuevos.descripcionTienda = body.descripcionTienda;
    // Gradiente
    if (body.colorSecundario !== undefined) datosNuevos.colorSecundario = body.colorSecundario;
    if (body.gradienteActivo !== undefined) datosNuevos.gradienteActivo = body.gradienteActivo;
    if (body.gradienteAngulo !== undefined) datosNuevos.gradienteAngulo = body.gradienteAngulo;
    // Hero
    if (body.heroTitulo !== undefined) datosNuevos.heroTitulo = body.heroTitulo;
    if (body.heroSubtitulo !== undefined) datosNuevos.heroSubtitulo = body.heroSubtitulo;
    if (body.heroCtaTexto !== undefined) datosNuevos.heroCtaTexto = body.heroCtaTexto;
    if (body.heroCtaUrl !== undefined) datosNuevos.heroCtaUrl = body.heroCtaUrl;
    if (body.heroTipo !== undefined) datosNuevos.heroTipo = body.heroTipo;
    if (body.heroTextPos !== undefined) datosNuevos.heroTextPos = body.heroTextPos;
    // Promociones
    if (body.promociones !== undefined) datosNuevos.promociones = body.promociones;
    // Contacto
    if (body.telefono !== undefined) datosNuevos.telefono = body.telefono;
    if (body.emailContacto !== undefined) datosNuevos.emailContacto = body.emailContacto;
    if (body.direccion !== undefined) datosNuevos.direccion = body.direccion;
    if (body.horario !== undefined) datosNuevos.horario = body.horario;
    // Redes sociales
    if (body.instagram !== undefined) datosNuevos.instagram = body.instagram;
    if (body.facebook !== undefined) datosNuevos.facebook = body.facebook;
    if (body.tiktok !== undefined) datosNuevos.tiktok = body.tiktok;
    if (body.twitter !== undefined) datosNuevos.twitter = body.twitter;
    if (body.youtube !== undefined) datosNuevos.youtube = body.youtube;
    // Colores parametrizables
    if (body.colorHeader !== undefined) datosNuevos.colorHeader = body.colorHeader;
    if (body.colorFondo !== undefined) datosNuevos.colorFondo = body.colorFondo;
    if (body.colorTexto !== undefined) datosNuevos.colorTexto = body.colorTexto;

    const updateData: Record<string, unknown> = {
      datos_tienda: datosNuevos,
      version: config.version + 1,
    };

    if (body.moneda !== undefined) updateData.moneda = body.moneda;

    const updated = await prisma.configuracionEmpresa.update({
      where: { empresa_id: empresaId },
      data: updateData,
    });

    auditLog({
      timestamp: new Date().toISOString(),
      accion: "UPDATE",
      recurso: "ConfiguracionEmpresa",
      recursoId: config.id,
      empresaId,
      usuarioId: req.auth?.userId,
      usuarioRol: req.auth?.role,
      datos: body,
    });

    res.json({ data: buildConfigResponse(updated) });
  } catch (err) {
    next(err);
  }
}
