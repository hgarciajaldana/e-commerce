'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { storeApi } from '@/lib/api'
import { Categoria, Producto } from '@/types'
import ProductCard from '@/components/store/ProductCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Pagination from '@/components/ui/Pagination'

// Path-based multi-tenant catalog:
// acme.localhost:3000/ uses subdomain resolution via middleware cookie.
// This page is for path-based access (e.g. localhost:3000/acme/).
// It forces the empresa-slug cookie to the slug from the URL, then fetches products.

export default function SlugCatalogPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState('')

  // Override cookie so API client picks up the path-based slug
  useEffect(() => {
    if (slug) {
      document.cookie = `x-empresa-slug=${encodeURIComponent(slug)};path=/;SameSite=Lax`
    }
  }, [slug])

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await storeApi.getProducts({
        page,
        limit: 20,
        busqueda: busqueda || undefined,
        categoriaId: categoriaId || undefined,
      })
      setProductos(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }, [page, busqueda, categoriaId])

  useEffect(() => {
    if (!slug) return
    storeApi
      .getCategories()
      .then((res) => setCategorias(res.data))
      .catch(() => {/* no crítico */})
  }, [slug])

  useEffect(() => {
    if (!slug) return
    fetchProductos()
  }, [fetchProductos, slug])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="search"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1) }}
          className="input flex-1"
        />
        <select
          value={categoriaId}
          onChange={(e) => { setCategoriaId(e.target.value); setPage(1) }}
          className="input sm:w-48"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {!loading && !error && (
        <p className="text-sm text-gray-500 mb-4">
          {total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <div className="max-w-md mx-auto py-10">
          <ErrorMessage message={error} onRetry={fetchProductos} />
        </div>
      )}

      {!loading && !error && productos.length === 0 && (
        <div className="text-center py-20 text-gray-500 text-lg">
          No se encontraron productos
        </div>
      )}

      {!loading && !error && productos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {productos.map((p) => (
              <ProductCard key={p.id} producto={p} baseHref={`/${slug}/producto`} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
