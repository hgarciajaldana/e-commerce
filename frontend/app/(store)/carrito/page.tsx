'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, removeFromCart, updateQuantity, getCartTotal } from '@/lib/cart'
import { Cart } from '@/types'
import { formatCurrency, buildImageUrl } from '@/lib/utils'

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({ items: [] })

  useEffect(() => {
    setCart(getCart())
    const handler = () => setCart(getCart())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const total = getCartTotal()

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Agrega productos para comenzar a comprar</p>
        <Link href="/" className="btn-primary">
          Ir al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Carrito de compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={item.varianteId} className="card p-4 flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {item.imagenUrl ? (
                  <Image
                    src={buildImageUrl(item.imagenUrl)}
                    alt={item.nombreProducto}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3h18" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.nombreProducto}</p>
                {item.nombreVariante && (
                  <p className="text-sm text-gray-500">{item.nombreVariante}</p>
                )}
                <p className="text-sm text-gray-500">{formatCurrency(item.precio)} c/u</p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.varianteId, item.cantidad - 1)}
                      className="h-7 w-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                    <button
                      onClick={() => updateQuantity(item.varianteId, item.cantidad + 1)}
                      className="h-7 w-7 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.precio * item.cantidad)}</p>
                    <button
                      onClick={() => removeFromCart(item.varianteId)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20 space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Resumen</h2>

            <div className="space-y-2 text-sm">
              {cart.items.map((item) => (
                <div key={item.varianteId} className="flex justify-between text-gray-600">
                  <span className="truncate mr-2">{item.nombreProducto} ×{item.cantidad}</span>
                  <span className="flex-shrink-0">{formatCurrency(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-semibold text-gray-900">
              <span>Total</span>
              <span className="text-lg text-blue-600">{formatCurrency(total)}</span>
            </div>

            <Link href="/checkout" className="btn-primary w-full text-center block">
              Proceder al checkout
            </Link>

            <Link href="/" className="btn-secondary w-full text-center block">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
