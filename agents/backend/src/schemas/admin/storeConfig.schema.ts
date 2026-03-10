import { z } from "zod";

const PromocionSchema = z.object({
  id: z.string(),
  titulo: z.string().max(200),
  subtitulo: z.string().max(500).optional().nullable(),
  imagenUrl: z.string().max(500),
  enlace: z.string().max(500).optional().nullable(),
  activa: z.boolean(),
  orden: z.number(),
});

export const UpdateStoreConfigSchema = z.object({
  // Campos existentes
  whatsappNumero: z.string().max(50).optional().nullable(),
  mensajeTemplate: z.string().max(5000).optional().nullable(),
  moneda: z.string().max(10).optional(),
  monedaSimbolo: z.string().max(10).optional(),
  colorPrimario: z.string().max(20).optional().nullable(),
  logoUrl: z.string().max(500).optional().nullable(),
  bannerUrl: z.string().max(500).optional().nullable(),
  tituloTienda: z.string().max(200).optional().nullable(),
  descripcionTienda: z.string().max(1000).optional().nullable(),

  // Gradiente
  colorSecundario: z.string().max(20).optional().nullable(),
  gradienteActivo: z.boolean().optional(),
  gradienteAngulo: z.number().min(0).max(360).optional(),

  // Hero section
  heroTitulo: z.string().max(200).optional().nullable(),
  heroSubtitulo: z.string().max(500).optional().nullable(),
  heroCtaTexto: z.string().max(100).optional().nullable(),
  heroCtaUrl: z.string().max(500).optional().nullable(),
  heroTipo: z.enum(["color", "gradiente", "imagen"]).optional(),
  heroTextPos: z.enum(["left", "center", "right"]).optional().nullable(),

  // Carrusel de promociones
  promociones: z.array(PromocionSchema).optional(),

  // Contacto
  telefono: z.string().max(50).optional().nullable(),
  emailContacto: z.string().max(200).optional().nullable(),
  direccion: z.string().max(500).optional().nullable(),
  horario: z.string().max(300).optional().nullable(),

  // Redes sociales
  instagram: z.string().max(200).optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),
  tiktok: z.string().max(200).optional().nullable(),
  twitter: z.string().max(200).optional().nullable(),
  youtube: z.string().max(200).optional().nullable(),

  // Colores parametrizables
  colorHeader: z.string().max(20).optional().nullable(),
  colorFondo: z.string().max(20).optional().nullable(),
  colorTexto: z.string().max(20).optional().nullable(),

  version: z.number().int().min(1, "version requerido para OCC"),
});

export type UpdateStoreConfigBody = z.infer<typeof UpdateStoreConfigSchema>;
