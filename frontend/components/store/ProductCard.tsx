'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Producto } from '@/types'
import { formatCurrency, buildImageUrl, getFirstImage } from '@/lib/utils'
import { addToCart } from '@/lib/cart'
import { useState } from 'react'

interface Props {
  producto: Producto
  monedaSimbolo?: string
  baseHref?: string
}

export default function ProductCard({ producto, monedaSimbolo = '$', baseHref = '/producto' }: Props) {
  const [added, setAdded] = useState(false)
  const imgUrl = getFirstImage(producto.imagenes)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    // Add default variant or product as item
    addToCart({
      varianteId: producto.id,
      productoId: producto.id,
      nombreProducto: producto.nombre,
      nombreVariante: null,
      precio: producto.precio,
      cantidad: 1,
      imagenUrl: imgUrl,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link
      href={`${baseHref}/${producto.id}`}
      className="card overflow-hidden group hover:shadow-md transition-shadow flex flex-col"
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

      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug flex-1">
          {producto.nombre}
        </h3>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-bold text-blue-600">
              {formatCurrency(producto.precio, monedaSimbolo)}
            </p>
            {producto.precioComparacion && producto.precioComparacion > producto.precio && (
              <p className="text-xs text-gray-400 line-through">
                {formatCurrency(producto.precioComparacion, monedaSimbolo)}
              </p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex-shrink-0 text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
              added
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {added ? '✓ Agregado' : '+ Carrito'}
          </button>
        </div>
      </div>
    </Link>
  )
}
