'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, removeFromCart, updateQuantity, getCartTotal } from '@/lib/cart'
import { Cart } from '@/types'
import { formatCurrency, buildImageUrl } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  monedaSimbolo?: string
}

export default function CartDrawer({ open, onClose, monedaSimbolo = '$' }: Props) {
  const [cart, setCart] = useState<Cart>({ items: [] })

  useEffect(() => {
    setCart(getCart())
    const handler = () => setCart(getCart())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const total = getCartTotal()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto w-full max-w-sm bg-white shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <svg className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <li key={item.varianteId} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.imagenUrl ? (
                      <Image
                        src={buildImageUrl(item.imagenUrl)}
                        alt={item.nombreProducto}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.nombreProducto}</p>
                    {item.nombreVariante && (
                      <p className="text-xs text-gray-500">{item.nombreVariante}</p>
                    )}
                    <p className="text-sm font-semibold text-blue-600 mt-0.5">
                      {formatCurrency(item.precio * item.cantidad, monedaSimbolo)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => updateQuantity(item.varianteId, item.cantidad - 1)}
                        className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm w-6 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.varianteId, item.cantidad + 1)}
                        className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.varianteId)}
                        className="ml-auto text-gray-400 hover:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(total, monedaSimbolo)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="btn-primary w-full text-center"
            >
              Ir al checkout
            </Link>
            <Link
              href="/carrito"
              onClick={onClose}
              className="btn-secondary w-full text-center"
            >
              Ver carrito completo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
