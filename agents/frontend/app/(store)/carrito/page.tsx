'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { getCart, updateQuantity, removeItem, clearCart, getCartTotal } from '@/lib/cart';
import { formatPrice, getImageUrl } from '@/lib/utils';
import type { Cart } from '@/types';
import Button from '@/components/ui/Button';

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCart(getCart());
    setLoaded(true);
  }, []);

  const refreshCart = (c: Cart) => {
    setCart({ ...c });
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleQty = (varianteId: string, qty: number) => {
    refreshCart(updateQuantity(varianteId, qty));
  };

  const handleRemove = (varianteId: string) => {
    refreshCart(removeItem(varianteId));
  };

  const handleClear = () => {
    refreshCart(clearCart());
  };

  const total = getCartTotal(cart);

  if (!loaded) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Seguir comprando
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Carrito de compras</h1>

      {cart.items.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <ShoppingBag size={56} className="mx-auto mb-4 opacity-25" />
          <p className="text-xl font-semibold text-gray-500 mb-2">Tu carrito está vacío</p>
          <p className="text-sm mb-6">Todavía no agregaste ningún producto.</p>
          <Link
            href="/productos"
            className="inline-block text-white font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item list */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.varianteId}
                className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(item.imagenUrl)}
                    alt={item.nombreProducto}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/producto/${item.productoId}`}
                    className="text-sm font-semibold text-gray-900 hover:underline line-clamp-1"
                  >
                    {item.nombreProducto}
                  </Link>
                  {item.nombreVariante && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.nombreVariante}</p>
                  )}
                  <p className="text-sm font-bold mt-1">{formatPrice(item.precio)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleQty(item.varianteId, item.cantidad - 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-6 text-center font-medium">{item.cantidad}</span>
                    <button
                      onClick={() => handleQty(item.varianteId, item.cantidad + 1)}
                      disabled={item.cantidad >= item.stock}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-40"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between">
                  <button
                    onClick={() => handleRemove(item.varianteId)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(item.precio * item.cantidad)}
                  </span>
                </div>
              </div>
            ))}

            <div className="text-right">
              <button
                onClick={handleClear}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Resumen del pedido</h2>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {cart.items.map((item) => (
                <div key={item.varianteId} className="flex justify-between">
                  <span className="truncate max-w-[160px]">
                    {item.nombreProducto} ×{item.cantidad}
                  </span>
                  <span>{formatPrice(item.precio * item.cantidad)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between font-semibold text-gray-900 text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block w-full text-center text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Proceder al pago
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
