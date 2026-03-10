// ============================================================
// SHARED TYPES — Ecommerce Multi-Tenant
// ============================================================

// --- Pagination ---
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

// --- Category ---
export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  orden: number;
  activo: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// --- Product ---
export interface ProductVariantSummary {
  id: string;
  nombre: string;
  sku?: string;
  precio?: number | null;
  stock: number;
  activo?: boolean;
  version?: number;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precioComparacion?: number;
  imagenes: ProductImage[];
  variantes?: ProductVariantSummary[];
  categoriaId?: string;
  categoria?: Category;
  destacado: boolean;
  en_promocion?: boolean;
  activo: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// --- Coleccion ---
export interface Coleccion {
  id: string;
  nombre: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  activa: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  esPrincipal: boolean;
  orden: number;
}

export interface Variant {
  id: string;
  nombre: string;
  sku?: string;
  precio?: number;
  stock: number;
  activo: boolean;
  version: number;
}

export interface ProductWithVariants extends Product {
  variantes: Variant[];
}

// --- Cart ---
export interface CartItem {
  varianteId: string;
  productoId: string;
  nombreProducto: string;
  nombreVariante: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string;
  stock: number;
}

export interface Cart {
  items: CartItem[];
}

// --- Checkout ---
export interface CheckoutForm {
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail: string;
  notas?: string;
}

export interface CheckoutRequest extends CheckoutForm {
  items: { varianteId: string; cantidad: number }[];
}

export interface CheckoutResponse {
  pedidoId: string;
  numeroPedido: string;
  whatsappUrl: string;
  total: number;
  subtotal: number;
}

// --- Order ---
export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'procesando'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export interface Order {
  id: string;
  numeroPedido: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteEmail?: string;
  estado: OrderStatus;
  subtotal: number;
  descuento: number;
  total: number;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  snapshotVariante: {
    nombreProducto: string;
    nombreVariante: string;
    sku?: string;
  };
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// --- Promociones carrusel ---
export type TextPos = 'left' | 'center' | 'right';

export interface PromocionCarrusel {
  id: string;
  titulo: string;
  subtitulo?: string | null;
  imagenUrl: string;
  enlace?: string | null;
  textoBoton?: string | null;
  textPos?: TextPos | null;
  activa: boolean;
  orden: number;
}

// --- Promocion Especial ---
export type TipoPromocion = 'dos_x_uno' | 'porcentaje' | 'bundle';

export interface PromocionEspecial {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  tipo: TipoPromocion;
  compra_cantidad?: number | null;
  llevas_cantidad?: number | null;
  porcentaje?: number | null;
  precio_original?: number | null;
  precio_final: number;
  productos_ids?: string[] | null;
  activa: boolean;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

// --- Store Config ---
export interface StoreConfig {
  id: string;
  whatsappNumero: string;
  mensajeTemplate?: string;
  moneda: string;
  monedaSimbolo: string;
  colorPrimario: string;
  logoUrl?: string;
  bannerUrl?: string;
  tituloTienda: string;
  descripcionTienda?: string;
  // Gradiente
  colorSecundario?: string | null;
  gradienteActivo?: boolean;
  gradienteAngulo?: number;
  // Colores adicionales
  colorHeader?: string | null;
  colorFondo?: string | null;
  colorTexto?: string | null;
  // Hero
  heroTitulo?: string | null;
  heroSubtitulo?: string | null;
  heroCtaTexto?: string;
  heroCtaUrl?: string;
  heroTipo?: 'color' | 'gradiente' | 'imagen';
  heroTextPos?: 'left' | 'center' | 'right' | null;
  // Carrusel
  promociones?: PromocionCarrusel[];
  // Contacto
  telefono?: string | null;
  emailContacto?: string | null;
  direccion?: string | null;
  horario?: string | null;
  // Redes sociales
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  version: number;
}

// --- Customer ---
export interface Customer {
  id: string;
  empresaId: string;
  telefono: string;
  nombre?: string;
  email?: string;
  notas?: string;
  totalPedidos: number;
  totalGastado: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerOrder {
  id: string;
  estado: OrderStatus;
  total: number;
  subtotal: number;
  descuento: number;
  notas?: string;
  datos_envio: Record<string, string> | null;
  created_at: string;
}

export interface CustomerWithOrders extends Customer {
  pedidos: CustomerOrder[];
}

// --- Empresa (Super Admin) ---
export interface Empresa {
  id: string;
  slug: string;
  subdominio: string;
  nombre: string;
  nit?: string;
  plan?: string;
  planId?: string;
  activa: boolean;
  version?: number;
  configuracion?: Record<string, unknown>;
  created_at?: string;
  createdAt: string;
  updatedAt?: string;
}

// --- Admin User ---
export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin_empresa' | 'super_admin';
  empresaId?: string;
  activo: boolean;
}

// --- API Error ---
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
