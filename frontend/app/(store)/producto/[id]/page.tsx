'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { storeApi } from '@/lib/api'
import { ProductoConVariantes, Variante } from '@/types'
import { formatCurrency, buildImageUrl } from '@/lib/utils'
import { addToCart } from '@/lib/cart'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [producto, setProducto] = useState<ProductoConVariantes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariante, setSelectedVariante] = useState<Variante | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!params.id) return
    setLoading(true)
    setError(null)
    storeApi
      .getProduct(params.id)
      .then((res) => {
        setProducto(res.data)
        const defaultVariante = res.data.variantes.find((v) => v.activo) ?? res.data.variantes[0] ?? null
        setSelectedVariante(defaultVariante)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Error al cargar el producto')
      })
      .finally(() => setLoading(false))
  }, [params.id])

  function handleAddToCart() {
    if (!producto) return
    const varianteId = selectedVariante?.id ?? producto.id
    const nombre = selectedVariante?.nombre ?? null
    const precio = selectedVariante?.precio ?? producto.precio
    const img = producto.imagenes.find((i) => i.esPrincipal)?.url ?? producto.imagenes[0]?.url ?? null

    addToCart({
      varianteId,
      productoId: producto.id,
      nombreProducto: producto.nombre,
      nombreVariante: nombre,
      precio,
      cantidad,
      imagenUrl: img,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <ErrorMessage message={error} onRetry={() => router.refresh()} />
      </div>
    )
  }

  if (!producto) return null

  const displayPrice = selectedVariante?.precio ?? producto.precio
  const sortedImages = [...producto.imagenes].sort((a, b) => {
    if (a.esPrincipal) return -1
    if (b.esPrincipal) return 1
    return a.orden - b.orden
  })
  const activeImage = sortedImages[activeImgIdx]
  const activeVariantes = producto.variantes.filter((v) => v.activo)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {activeImage ? (
              <Image
                src={buildImageUrl(activeImage.url)}
                alt={producto.nombre}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
            {producto.destacado && (
              <span className="absolute top-3 left-3 badge bg-yellow-100 text-yellow-800">Destacado</span>
            )}
          </div>

          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`relative flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === activeImgIdx ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={buildImageUrl(img.url)}
                    alt={`${producto.nombre} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {producto.categoria && (
            <p className="text-sm text-blue-600 font-medium">{producto.categoria.nombre}</p>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{producto.nombre}</h1>

          <div>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(displayPrice)}</p>
            {producto.precioComparacion && producto.precioComparacion > producto.precio && (
              <p className="text-sm text-gray-400 line-through mt-1">
                {formatCurrency(producto.precioComparacion)}
              </p>
            )}
          </div>

          {producto.descripcion && (
            <p className="text-gray-600 leading-relaxed">{producto.descripcion}</p>
          )}

          {/* Variantes */}
          {activeVariantes.length > 0 && (
            <div>
              <p className="label">Variante</p>
              <div className="flex flex-wrap gap-2">
                {activeVariantes.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariante(v)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariante?.id === v.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {v.nombre}
                    {v.precio && v.precio !== producto.precio && (
                      <span className="ml-1 text-xs text-gray-500">({formatCurrency(v.precio)})</span>
                    )}
                  </button>
                ))}
              </div>
              {selectedVariante && selectedVariante.stock === 0 && (
                <p className="text-sm text-red-500 mt-1">Sin stock disponible</p>
              )}
            </div>
          )}

          {/* Cantidad */}
          <div>
            <p className="label">Cantidad</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-lg font-medium"
              >
                −
              </button>
              <span className="w-10 text-center font-medium text-gray-900">{cantidad}</span>
              <button
                onClick={() => setCantidad((c) => c + 1)}
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-lg font-medium"
              >
                +
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={selectedVariante?.stock === 0}
            className={`w-full btn-primary py-3 text-base ${
              added ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
          >
            {added ? '✓ Agregado al carrito' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}
