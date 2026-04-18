'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { storeApi } from '@/lib/api'
import { Categoria, Producto } from '@/types'
import { formatCurrency, buildImageUrl, getFirstImage } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Pagination from '@/components/ui/Pagination'

export default function CatalogPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [monedaSimbolo, setMonedaSimbolo] = useState('$')

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
    storeApi
      .getCategories()
      .then((res) => setCategorias(res.data))
      .catch(() => {/* silenciar — no crítico */})
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and filters */}
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

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-gray-500 mb-4">
          {total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
        </p>
      )}

      {/* States */}
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
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
        </div>
      )}

      {!loading && !error && productos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {productos.map((producto) => {
              const imgUrl = getFirstImage(producto.imagenes)
              return (
                <Link
                  key={producto.id}
                  href={`/productos/${producto.id}`}
                  className="card overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square relative bg-gray-100 overflow-hidden">
                    {imgUrl ? (
                      <Image
                        src={buildImageUrl(imgUrl)}
                        alt={producto.nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    {producto.destacado && (
                      <span className="absolute top-2 left-2 badge bg-yellow-100 text-yellow-800 text-xs">
                        Destacado
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                      {producto.nombre}
                    </h3>
                    <p className="mt-1.5 text-base font-bold text-blue-600">
                      {formatCurrency(producto.precio, monedaSimbolo)}
                    </p>
                    {producto.precioComparacion && producto.precioComparacion > producto.precio && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatCurrency(producto.precioComparacion, monedaSimbolo)}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
