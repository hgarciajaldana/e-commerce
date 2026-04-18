/**
 * API client — centralizes all HTTP calls to the backend.
 * - Reads the empresa slug from the x-empresa-slug cookie (set by middleware.ts).
 * - Attaches Authorization: Bearer <token> for authenticated routes.
 * - All public store calls go through /api/v1/store/*
 * - Admin calls go through /api/v1/admin/* (require JWT)
 * - Super admin calls go through /api/v1/superadmin/* (require JWT)
 */

import {
  Categoria,
  CheckoutResponse,
  EmpresaConfig,
  Empresa,
  PaginatedResponse,
  Pedido,
  PedidoConItems,
  Producto,
  ProductoConVariantes,
  SingleResponse,
  Variante,
} from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ─── helpers ───────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

function getEmpresaSlug(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )x-empresa-slug=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function slugHeaders(): Record<string, string> {
  const slug = getEmpresaSlug()
  return slug ? { 'x-empresa-slug': slug } : {}
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean; slug?: boolean } = {}
): Promise<T> {
  const { auth = false, slug = false, ...fetchOptions } = options

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
    ...(slug ? slugHeaders() : {}),
    ...(auth ? authHeaders() : {}),
  }

  // Only set Content-Type for JSON bodies (not multipart)
  if (
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}`
    try {
      const errBody = await res.json()
      errorMessage = errBody.message || errBody.error || errorMessage
    } catch {
      // ignore JSON parse errors on error body
    }
    const err = new Error(errorMessage) as Error & { status: number }
    err.status = res.status
    throw err
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── AUTH API ──────────────────────────────────────────────

export interface LoginResponse {
  token: string
}

export const authApi = {
  login(email: string, password: string): Promise<LoginResponse> {
    return request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  loginSuperAdmin(email: string, password: string): Promise<LoginResponse> {
    return request('/api/v1/auth/superadmin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
}

// ─── PUBLIC STORE API ──────────────────────────────────────

export interface StorePublicConfig {
  empresaNombre: string
  tituloTienda: string | null
  descripcionTienda: string | null
  logoUrl: string | null
  bannerUrl: string | null
  whatsappNumero: string | null
  moneda: string
  monedaSimbolo: string
  colorPrimario: string | null
  telefonoContacto: string | null
  emailContacto: string | null
  redesSociales: {
    facebook?: string
    instagram?: string
    twitter?: string
    tiktok?: string
  } | null
}

export const storeApi = {
  getConfig(): Promise<{ data: StorePublicConfig }> {
    return request('/api/v1/store/config', { slug: true })
  },

  getCategories(): Promise<{ data: Categoria[] }> {
    return request('/api/v1/store/categories', { slug: true })
  },

  getProducts(params?: {
    categoriaId?: string
    busqueda?: string
    page?: number
    limit?: number
    destacado?: boolean
  }): Promise<PaginatedResponse<Produto>> {
    const qs = new URLSearchParams()
    if (params?.categoriaId) qs.set('categoriaId', params.categoriaId)
    if (params?.busqueda) qs.set('busqueda', params.busqueda)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.destacado !== undefined) qs.set('destacado', String(params.destacado))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/v1/store/products${query}`, { slug: true })
  },

  getProduct(id: string): Promise<SingleResponse<ProductoConVariantes>> {
    return request(`/api/v1/store/products/${id}`, { slug: true })
  },

  checkout(body: {
    clienteNombre: string
    clienteTelefono: string
    clienteEmail?: string
    notas?: string
    items: { varianteId: string; cantidad: number }[]
    idempotencyKey: string
  }): Promise<CheckoutResponse> {
    const { idempotencyKey, ...payload } = body
    return request('/api/v1/store/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Idempotency-Key': idempotencyKey },
      slug: true,
    })
  },
}

// ─── ADMIN API ─────────────────────────────────────────────

export const adminApi = {
  // Categories
  getCategories(params?: {
    page?: number
    limit?: number
    activo?: boolean
  }): Promise<PaginatedResponse<Categoria>> {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.activo !== undefined) qs.set('activo', String(params.activo))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/v1/admin/categories${query}`, { auth: true, slug: true })
  },

  createCategory(body: {
    nombre: string
    descripcion?: string
    imagenUrl?: string
    orden?: number
  }): Promise<Categoria> {
    return request('/api/v1/admin/categories', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },

  updateCategory(
    id: string,
    body: {
      nombre?: string
      descripcion?: string
      imagenUrl?: string
      orden?: number
      activo?: boolean
      version: number
    }
  ): Promise<Categoria> {
    return request(`/api/v1/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },

  deleteCategory(id: string): Promise<void> {
    return request(`/api/v1/admin/categories/${id}`, {
      method: 'DELETE',
      auth: true,
      slug: true,
    })
  },

  // Products
  getProducts(params?: {
    categoriaId?: string
    busqueda?: string
    page?: number
    limit?: number
    activo?: boolean
  }): Promise<PaginatedResponse<Producto>> {
    const qs = new URLSearchParams()
    if (params?.categoriaId) qs.set('categoriaId', params.categoriaId)
    if (params?.busqueda) qs.set('busqueda', params.busqueda)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.activo !== undefined) qs.set('activo', String(params.activo))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/v1/admin/products${query}`, { auth: true, slug: true })
  },

  createProduct(body: {
    nombre: string
    descripcion?: string
    precio: number
    categoriaId?: string
    destacado?: boolean
    imagenes?: string[]
  }): Promise<Producto> {
    return request('/api/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },

  updateProduct(
    id: string,
    body: {
      nombre?: string
      descripcion?: string
      precio?: number
      categoriaId?: string
      activo?: boolean
      destacado?: boolean
      version: number
    }
  ): Promise<Produto> {
    return request(`/api/v1/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },

  deleteProduct(id: string): Promise<void> {
    return request(`/api/v1/admin/products/${id}`, {
      method: 'DELETE',
      auth: true,
      slug: true,
    })
  },

  // Variants
  getVariants(productId: string): Promise<{ data: Variante[] }> {
    return request(`/api/v1/admin/products/${productId}/variants`, {
      auth: true,
      slug: true,
    })
  },

  createVariant(
    productId: string,
    body: { nombre: string; sku?: string; precio?: number; stock?: number }
  ): Promise<Variante> {
    return request(`/api/v1/admin/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },

  updateVariant(
    productId: string,
    variantId: string,
    body: {
      nombre?: string
      precio?: number
      stock?: number
      activo?: boolean
      version: number
    }
  ): Promise<Variante> {
    return request(`/api/v1/admin/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },

  deleteVariant(productId: string, variantId: string): Promise<void> {
    return request(`/api/v1/admin/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
      auth: true,
      slug: true,
    })
  },

  // Images
  uploadImage(productId: string, file: File): Promise<{ url: string; archivoId: string }> {
    const formData = new FormData()
    formData.append('file', file)
    return request(`/api/v1/admin/products/${productId}/images`, {
      method: 'POST',
      body: formData,
      auth: true,
      slug: true,
    })
  },

  addImageByUrl(productId: string, url: string): Promise<{ url: string; archivoId: string }> {
    return request(`/api/v1/admin/products/${productId}/images`, {
      method: 'POST',
      body: JSON.stringify({ url }),
      auth: true,
      slug: true,
    })
  },

  deleteImage(productId: string, archivoId: string): Promise<void> {
    return request(`/api/v1/admin/products/${productId}/images`, {
      method: 'DELETE',
      body: JSON.stringify({ archivoId }),
      auth: true,
      slug: true,
    })
  },

  // Orders
  getOrders(params?: {
    estado?: string
    fechaDesde?: string
    fechaHasta?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Pedido>> {
    const qs = new URLSearchParams()
    if (params?.estado) qs.set('estado', params.estado)
    if (params?.fechaDesde) qs.set('fechaDesde', params.fechaDesde)
    if (params?.fechaHasta) qs.set('fechaHasta', params.fechaHasta)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/v1/admin/orders${query}`, { auth: true, slug: true })
  },

  getOrder(id: string): Promise<SingleResponse<PedidoConItems>> {
    return request(`/api/v1/admin/orders/${id}`, { auth: true, slug: true })
  },

  updateOrderStatus(
    id: string,
    body: { estado: string; notas?: string }
  ): Promise<Pedido> {
    return request(`/api/v1/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },

  // Store config
  getStoreConfig(): Promise<SingleResponse<EmpresaConfig>> {
    return request('/api/v1/admin/store-config', { auth: true, slug: true })
  },

  updateStoreConfig(body: Partial<EmpresaConfig> & { version: number }): Promise<EmpresaConfig> {
    return request('/api/v1/admin/store-config', {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
      slug: true,
    })
  },
}

// ─── SUPER ADMIN API ───────────────────────────────────────

export const superAdminApi = {
  getEmpresas(params?: {
    page?: number
    limit?: number
    activo?: boolean
  }): Promise<PaginatedResponse<Empresa>> {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.activo !== undefined) qs.set('activo', String(params.activo))
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return request(`/api/v1/superadmin/empresas${query}`, { auth: true })
  },

  createEmpresa(body: {
    slug: string
    nombre: string
    planId: string
    configuracion?: Record<string, unknown>
  }): Promise<Empresa> {
    return request('/api/v1/superadmin/empresas', {
      method: 'POST',
      body: JSON.stringify(body),
      auth: true,
    })
  },

  getEmpresa(id: string): Promise<SingleResponse<Empresa>> {
    return request(`/api/v1/superadmin/empresas/${id}`, { auth: true })
  },

  updateEmpresa(
    id: string,
    body: { nombre?: string; activo?: boolean; planId?: string }
  ): Promise<Empresa> {
    return request(`/api/v1/superadmin/empresas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      auth: true,
    })
  },

  deleteEmpresa(id: string): Promise<void> {
    return request(`/api/v1/superadmin/empresas/${id}`, {
      method: 'DELETE',
      auth: true,
    })
  },

  invalidateTokens(id: string): Promise<void> {
    return request(`/api/v1/superadmin/empresas/${id}/invalidate-tokens`, {
      method: 'POST',
      auth: true,
    })
  },
}

// Fix typo alias
type Produto = Producto
