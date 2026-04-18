// ============================================================
// DOMAIN TYPES — aligned with API contracts
// ============================================================

export interface Empresa {
  id: string
  slug: string
  nombre: string
  planId: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface EmpresaConfig {
  id: string
  empresaId: string
  whatsappNumero: string | null
  mensajeTemplate: string | null
  moneda: string
  monedaSimbolo: string
  colorPrimario: string | null
  logoUrl: string | null
  bannerUrl: string | null
  tituloTienda: string | null
  descripcionTienda: string | null
  telefonoContacto: string | null
  emailContacto: string | null
  redesSociales: {
    facebook?: string
    instagram?: string
    twitter?: string
    tiktok?: string
  } | null
  version: number
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  imagenUrl: string | null
  orden: number
  activo: boolean
  version: number
}

export interface Imagen {
  id: string
  url: string
  esPrincipal: boolean
  orden: number
}

export interface Variante {
  id: string
  nombre: string
  sku: string | null
  precio: number | null
  stock: number
  activo: boolean
  version: number
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  precioComparacion: number | null
  imagenes: Imagen[]
  destacado: boolean
  activo: boolean
  categoriaId: string | null
  categoria: Categoria | null
  version: number
}

export interface ProductoConVariantes extends Producto {
  variantes: Variante[]
}

export interface PedidoItem {
  id: string
  varianteId: string
  nombreProducto: string
  nombreVariante: string | null
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Pedido {
  id: string
  numeroPedido: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail: string | null
  estado: EstadoPedido
  subtotal: number
  descuento: number
  total: number
  notas: string | null
  whatsappUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface PedidoConItems extends Pedido {
  items: PedidoItem[]
}

export type EstadoPedido =
  | 'pendiente'
  | 'confirmado'
  | 'en_proceso'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

// ============================================================
// API RESPONSE SHAPES
// ============================================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  limit: number
}

export interface SingleResponse<T> {
  data: T
}

export interface CheckoutResponse {
  pedidoId: string
  numeroPedido: string
  whatsappUrl: string
  total: number
  subtotal: number
}

// ============================================================
// CART TYPES
// ============================================================

export interface CartItem {
  varianteId: string
  productoId: string
  nombreProducto: string
  nombreVariante: string | null
  precio: number
  cantidad: number
  imagenUrl: string | null
}

export interface Cart {
  items: CartItem[]
}

// ============================================================
// FORM / INPUT TYPES
// ============================================================

export interface CheckoutFormData {
  clienteNombre: string
  clienteTelefono: string
  clienteEmail: string
  notas: string
}

export interface ProductoFormData {
  nombre: string
  descripcion: string
  precio: string
  categoriaId: string
  destacado: boolean
  activo: boolean
}

export interface CategoriaFormData {
  nombre: string
  descripcion: string
  imagenUrl: string
  orden: string
  activo: boolean
}

export interface StoreConfigFormData {
  whatsappNumero: string
  mensajeTemplate: string
  moneda: string
  monedaSimbolo: string
  colorPrimario: string
  logoUrl: string
  bannerUrl: string
  tituloTienda: string
  descripcionTienda: string
  telefonoContacto: string
  emailContacto: string
  instagramUrl: string
  facebookUrl: string
}

// ============================================================
// AUTH
// ============================================================

export interface JWTPayload {
  sub: string
  rol: 'admin_empresa' | 'super_admin'
  empresaId: string | null
  tokenVersion: number
  exp: number
  iat: number
}
