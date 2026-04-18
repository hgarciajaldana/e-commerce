'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { adminApi } from '@/lib/api'
import { Producto } from '@/types'
import { formatCurrency, buildImageUrl, getFirstImage } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  onEdit: (producto: Producto) => void
  refresh?: number
}

export default function ProductList({ onEdit, refresh }: Props) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getProducts({ page, limit: 20, busqueda: busqueda || undefined })
      setProductos(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [page, busqueda])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos, refresh])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      fetchProductos()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el producto')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1) }}
          className="input max-w-xs"
        />
        <span className="text-sm text-gray-500 self-center">{total} producto{total !== 1 ? 's' : ''}</span>
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && error && (
        <ErrorMessage message={error} onRetry={fetchProductos} />
      )}

      {!loading && !error && productos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No se encontraron productos
        </div>
      )}

      {!loading && !error && productos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="pb-3 pr-4 w-12"></th>
                <th className="pb-3 pr-4">Producto</th>
                <th className="pb-3 pr-4">Precio</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map((p) => {
                const imgUrl = getFirstImage(p.imagenes)
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {imgUrl ? (
                          <Image
                            src={buildImageUrl(imgUrl)}
                            alt={p.nombre}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-300">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3h18" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900 line-clamp-1">{p.nombre}</p>
                      {p.categoria && (
                        <p className="text-xs text-gray-400">{p.categoria.nombre}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-900">
                      {formatCurrency(p.precio)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {p.destacado && (
                        <span className="badge bg-yellow-100 text-yellow-700 ml-1">Destacado</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(p)}
                          className="text-xs btn-secondary px-3 py-1"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="text-xs btn-danger px-3 py-1"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel={deleting ? 'Eliminando…' : 'Eliminar'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  )
}
