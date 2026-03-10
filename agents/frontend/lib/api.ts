/**
 * API Client — Ecommerce Multi-Tenant
 * All requests include x-empresa-slug header (set by middleware via cookies).
 * Admin requests include Authorization: Bearer <jwt>.
 */

import type {
  Category,
  Coleccion,
  Product,
  ProductWithVariants,
  Variant,
  PaginatedResponse,
  CheckoutRequest,
  CheckoutResponse,
  Order,
  OrderWithItems,
  OrderStatus,
  StoreConfig,
  Empresa,
  Customer,
  CustomerWithOrders,
  PromocionEspecial,
} from '@/types';
import { generateIdempotencyKey } from '@/lib/utils';
import { getToken, getNit } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = false, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  };

  // x-empresa-slug is injected by Next.js middleware into cookies
  if (typeof window !== 'undefined') {
    const slug = document.cookie
      .split('; ')
      .find((row) => row.startsWith('x-empresa-slug='))
      ?.split('=')[1];
    if (slug) headers['x-empresa-slug'] = slug;
  }

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const nit = getNit();
    if (nit) headers['x-empresa-nit'] = nit;
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorData = body.error || body;
    const error = new Error(errorData.message || body.message || `HTTP ${res.status}`) as Error & {
      status: number;
      code?: string;
      details?: unknown;
    };
    error.status = res.status;
    error.code = errorData.code || body.code;
    if (errorData.details) error.details = errorData.details;
    throw error;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ─── Store Public API ─────────────────────────────────────────────────────────

export const storeApi = {
  getConfig(): Promise<{ data: StoreConfig }> {
    return apiFetch('/api/v1/store/config');
  },

  getCategories(): Promise<{ data: Category[] }> {
    return apiFetch('/api/v1/store/categories');
  },

  getProducts(params?: {
    categoriaId?: string;
    busqueda?: string;
    page?: number;
    limit?: number;
    destacado?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    const qs = new URLSearchParams();
    if (params?.categoriaId) qs.set('categoriaId', params.categoriaId);
    if (params?.busqueda) qs.set('busqueda', params.busqueda);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.destacado !== undefined) qs.set('destacado', String(params.destacado));
    return apiFetch(`/api/v1/store/products?${qs}`);
  },

  getProduct(id: string): Promise<{ data: ProductWithVariants }> {
    return apiFetch<unknown>(`/api/v1/store/products/${id}`).then((res) => {
      // Handle both { data: {...} } wrapper and raw product (in case backend returns directly)
      const product: ProductWithVariants =
        res && typeof res === 'object' && 'data' in (res as object)
          ? (res as { data: ProductWithVariants }).data
          : (res as ProductWithVariants);
      // Normalize variant fields (Prisma raw vs mapped)
      if (product?.variantes) {
        product.variantes = product.variantes.map((v) => ({
          ...v,
          activo: (v as unknown as { activa?: boolean }).activa ?? v.activo ?? true,
          precio: v.precio != null ? Number(v.precio) : undefined,
        }));
      }
      // Normalize top-level precio (precio_base alias or Prisma Decimal string)
      if (product && (product as unknown as { precio_base?: unknown }).precio_base != null) {
        product.precio = Number((product as unknown as { precio_base: unknown }).precio_base);
      } else if (product && product.precio != null) {
        product.precio = Number(product.precio);
      }
      if (product && product.precioComparacion != null) {
        product.precioComparacion = Number(product.precioComparacion);
      }
      return { data: product };
    });
  },

  getPromociones(): Promise<PaginatedResponse<Product>> {
    return apiFetch('/api/v1/store/promociones');
  },

  getPromocionesEspeciales(): Promise<{ data: PromocionEspecial[] }> {
    return apiFetch('/api/v1/store/promociones-especiales');
  },

  getColeccion(slug: string): Promise<{ data: Coleccion & { productos: Product[] } }> {
    return apiFetch(`/api/v1/store/colecciones/${slug}`);
  },

  checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
    return apiFetch('/api/v1/store/checkout', {
      method: 'POST',
      headers: { 'Idempotency-Key': generateIdempotencyKey() },
      body: JSON.stringify(data),
    });
  },

  lookupCliente(params: { email?: string; telefono?: string }): Promise<{ data: { nombre: string; email: string; telefono: string } }> {
    const qs = new URLSearchParams();
    if (params.email) qs.set('email', params.email);
    if (params.telefono) qs.set('telefono', params.telefono);
    return apiFetch(`/api/v1/store/clientes/lookup?${qs}`);
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  // Categories
  getCategories(params?: {
    page?: number;
    limit?: number;
    activo?: boolean;
  }): Promise<PaginatedResponse<Category>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.activo !== undefined) qs.set('activo', String(params.activo));
    return apiFetch(`/api/v1/admin/categories?${qs}`, { auth: true });
  },

  createCategory(data: {
    nombre: string;
    descripcion?: string;
    imagenUrl?: string;
    orden?: number;
  }): Promise<{ data: Category }> {
    return apiFetch('/api/v1/admin/categories', {
      auth: true,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory(
    id: string,
    data: Partial<Category> & { version: number }
  ): Promise<{ data: Category }> {
    return apiFetch(`/api/v1/admin/categories/${id}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCategory(id: string): Promise<void> {
    return apiFetch(`/api/v1/admin/categories/${id}`, { auth: true, method: 'DELETE' });
  },

  // Products
  getProducts(params?: {
    categoriaId?: string;
    busqueda?: string;
    page?: number;
    limit?: number;
    activo?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    const qs = new URLSearchParams();
    if (params?.categoriaId) qs.set('categoriaId', params.categoriaId);
    if (params?.busqueda) qs.set('busqueda', params.busqueda);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.activo !== undefined) qs.set('activo', String(params.activo));
    return apiFetch(`/api/v1/admin/products?${qs}`, { auth: true });
  },

  createProduct(data: {
    nombre: string;
    descripcion?: string;
    precio: number;
    categoriaId?: string;
    destacado?: boolean;
    en_promocion?: boolean;
  }): Promise<{ data: Product }> {
    return apiFetch('/api/v1/admin/products', {
      auth: true,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProduct(
    id: string,
    data: Partial<Product> & { version: number }
  ): Promise<{ data: Product }> {
    return apiFetch(`/api/v1/admin/products/${id}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProduct(id: string): Promise<void> {
    return apiFetch(`/api/v1/admin/products/${id}`, { auth: true, method: 'DELETE' });
  },

  // Variants
  getVariants(productId: string): Promise<{ data: Variant[] }> {
    return apiFetch(`/api/v1/admin/products/${productId}/variants`, { auth: true });
  },

  createVariant(
    productId: string,
    data: { nombre: string; sku?: string; precio?: number; stock?: number }
  ): Promise<{ data: Variant }> {
    return apiFetch(`/api/v1/admin/products/${productId}/variants`, {
      auth: true,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateVariant(
    productId: string,
    variantId: string,
    data: Partial<Variant> & { version: number }
  ): Promise<{ data: Variant }> {
    return apiFetch(`/api/v1/admin/products/${productId}/variants/${variantId}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteVariant(productId: string, variantId: string): Promise<void> {
    return apiFetch(`/api/v1/admin/products/${productId}/variants/${variantId}`, {
      auth: true,
      method: 'DELETE',
    });
  },

  // Images
  uploadImage(productId: string, file: File): Promise<{ url: string; archivoId: string }> {
    const form = new FormData();
    form.append('file', file);
    const token = getToken();
    const nit = getNit();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (nit) headers['x-empresa-nit'] = nit;
    return fetch(`${API_URL}/api/v1/admin/products/${productId}/images`, {
      method: 'POST',
      headers,
      body: form,
    }).then(async (r) => {
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
      const data = await r.json();
      return { url: data.url, archivoId: data.id };
    });
  },

  addImageUrl(productId: string, url: string): Promise<{ url: string; archivoId: string }> {
    return apiFetch<{ url: string; id: string }>(`/api/v1/admin/products/${productId}/images`, {
      auth: true,
      method: 'POST',
      body: JSON.stringify({ url }),
    }).then((data) => ({ url: data.url, archivoId: data.id }));
  },

  deleteImage(productId: string, archivoId: string): Promise<void> {
    return apiFetch(`/api/v1/admin/products/${productId}/images/${archivoId}`, {
      auth: true,
      method: 'DELETE',
    });
  },

  // Orders
  getOrders(params?: {
    estado?: OrderStatus;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> {
    const qs = new URLSearchParams();
    if (params?.estado) qs.set('estado', params.estado);
    if (params?.fechaDesde) qs.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) qs.set('fechaHasta', params.fechaHasta);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiFetch(`/api/v1/admin/orders?${qs}`, { auth: true });
  },

  getOrder(id: string): Promise<{ data: OrderWithItems }> {
    return apiFetch(`/api/v1/admin/orders/${id}`, { auth: true });
  },

  updateOrderStatus(
    id: string,
    estado: OrderStatus,
    notas?: string
  ): Promise<{ data: Order }> {
    return apiFetch(`/api/v1/admin/orders/${id}/status`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify({ estado, notas }),
    });
  },

  // Customers
  getCustomers(params?: { page?: number; limit?: number; busqueda?: string }): Promise<PaginatedResponse<Customer>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.busqueda) qs.set('busqueda', params.busqueda);
    return apiFetch(`/api/v1/admin/customers?${qs}`, { auth: true });
  },

  getCustomer(id: string): Promise<{ data: CustomerWithOrders }> {
    return apiFetch(`/api/v1/admin/customers/${id}`, { auth: true });
  },

  updateCustomer(id: string, data: { nombre?: string; email?: string | null; notas?: string | null }): Promise<{ data: Customer }> {
    return apiFetch(`/api/v1/admin/customers/${id}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Assets genéricos (logo, banner, slides del carrusel)
  uploadAsset(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    const token = getToken();
    const nit = getNit();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (nit) headers['x-empresa-nit'] = nit;
    return fetch(`${API_URL}/api/v1/admin/assets/upload`, {
      method: 'POST',
      headers,
      body: form,
    }).then(async (r) => {
      if (!r.ok) throw new Error(`Upload fallido: ${r.status}`);
      return r.json();
    });
  },

  // Colecciones
  getColecciones(): Promise<{ data: Coleccion[] }> {
    return apiFetch('/api/v1/admin/colecciones', { auth: true });
  },

  createColeccion(data: {
    nombre: string;
    descripcion?: string;
    imagenUrl?: string;
  }): Promise<{ data: Coleccion }> {
    return apiFetch('/api/v1/admin/colecciones', {
      auth: true,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateColeccion(
    id: string,
    data: { nombre?: string; descripcion?: string; imagenUrl?: string | null; activa?: boolean; version: number }
  ): Promise<{ data: Coleccion }> {
    return apiFetch(`/api/v1/admin/colecciones/${id}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteColeccion(id: string): Promise<void> {
    return apiFetch(`/api/v1/admin/colecciones/${id}`, { auth: true, method: 'DELETE' });
  },

  getColeccionProductos(id: string): Promise<{ data: Product[] }> {
    return apiFetch(`/api/v1/admin/colecciones/${id}/productos`, { auth: true });
  },

  addProductoColeccion(coleccionId: string, productoId: string): Promise<void> {
    return apiFetch(`/api/v1/admin/colecciones/${coleccionId}/productos`, {
      auth: true,
      method: 'POST',
      body: JSON.stringify({ productoId }),
    });
  },

  removeProductoColeccion(coleccionId: string, productoId: string): Promise<void> {
    return apiFetch(`/api/v1/admin/colecciones/${coleccionId}/productos/${productoId}`, {
      auth: true,
      method: 'DELETE',
    });
  },

  // Promociones Especiales
  getPromocionesEspeciales(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<PromocionEspecial>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiFetch(`/api/v1/admin/promociones-especiales?${qs}`, { auth: true });
  },

  getPromocionEspecial(id: string): Promise<{ data: PromocionEspecial }> {
    return apiFetch(`/api/v1/admin/promociones-especiales/${id}`, { auth: true });
  },

  createPromocionEspecial(data: Omit<PromocionEspecial, 'id' | 'empresa_id' | 'version' | 'created_at' | 'updated_at'>): Promise<{ data: PromocionEspecial }> {
    return apiFetch('/api/v1/admin/promociones-especiales', {
      auth: true,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePromocionEspecial(id: string, data: Partial<Omit<PromocionEspecial, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>> & { version: number }): Promise<{ data: PromocionEspecial }> {
    return apiFetch(`/api/v1/admin/promociones-especiales/${id}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePromocionEspecial(id: string): Promise<void> {
    return apiFetch(`/api/v1/admin/promociones-especiales/${id}`, { auth: true, method: 'DELETE' });
  },

  // Store Config
  getStoreConfig(): Promise<{ data: StoreConfig }> {
    return apiFetch('/api/v1/admin/store-config', { auth: true });
  },

  updateStoreConfig(data: Partial<StoreConfig> & { version: number }): Promise<{ data: StoreConfig }> {
    return apiFetch('/api/v1/admin/store-config', {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ─── Super Admin API ──────────────────────────────────────────────────────────

export const superAdminApi = {
  getEmpresas(params?: {
    page?: number;
    limit?: number;
    activo?: boolean;
  }): Promise<PaginatedResponse<Empresa>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.activo !== undefined) qs.set('activo', String(params.activo));
    return apiFetch(`/api/v1/superadmin/empresas?${qs}`, { auth: true });
  },

  createEmpresa(data: {
    portal_company_id?: string;
    slug: string;
    nombre: string;
    nit: string;
    planId: string;
    configuracion?: Record<string, unknown>;
  }): Promise<{ data: Empresa }> {
    const { slug, planId, ...rest } = data;
    return apiFetch('/api/v1/superadmin/empresas', {
      auth: true,
      method: 'POST',
      body: JSON.stringify({ ...rest, subdominio: slug, plan: planId }),
    });
  },

  getEmpresa(id: string): Promise<{ data: Empresa }> {
    return apiFetch(`/api/v1/superadmin/empresas/${id}`, { auth: true });
  },

  updateEmpresa(
    id: string,
    data: { nombre?: string; activa?: boolean; planId?: string }
  ): Promise<{ data: Empresa }> {
    return apiFetch(`/api/v1/superadmin/empresas/${id}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteEmpresa(id: string): Promise<void> {
    return apiFetch(`/api/v1/superadmin/empresas/${id}`, { auth: true, method: 'DELETE' });
  },

  invalidateTokens(id: string): Promise<{ message: string }> {
    return apiFetch(`/api/v1/superadmin/empresas/${id}/invalidate-tokens`, {
      auth: true,
      method: 'POST',
    });
  },
};
