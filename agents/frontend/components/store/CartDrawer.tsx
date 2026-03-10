'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { getCart, updateQuantity, removeItem, getCartTotal } from '@/lib/cart';
import { formatPrice, getImageUrl } from '@/lib/utils';
import type { Cart } from '@/types';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCartChange?: (count: number) => void;
  monedaSimbolo?: string;
}

export default function CartDrawer({
  open,
  onClose,
  onCartChange,
  monedaSimbolo = '$',
}: CartDrawerProps) {
  const [cart, setCart] = useState<Cart>({ items: [] });

  useEffect(() => {
    if (open) {
      setCart(getCart());
    }
  }, [open]);

  useEffect(() => {
    const handler = () => {
      const updated = getCart();
      setCart(updated);
      const count = updated.items.reduce((s, i) => s + i.cantidad, 0);
      onCartChange?.(count);
    };
    window.addEventListener('cart-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('cart-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, [onCartChange]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleQtyChange = (varianteId: string, qty: number) => {
    const updated = updateQuantity(varianteId, qty);
    setCart({ ...updated });
    const count = updated.items.reduce((s, i) => s + i.cantidad, 0);
    onCartChange?.(count);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleRemove = (varianteId: string) => {
    const updated = removeItem(varianteId);
    setCart({ ...updated });
    const count = updated.items.reduce((s, i) => s + i.cantidad, 0);
    onCartChange?.(count);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const total = getCartTotal(cart);
  const itemCount = cart.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={20} />
            Carrito
            {itemCount > 0 && (
              <span
                className="text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {itemCount}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Cerrar carrito"
          >
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-16">
              <ShoppingBag size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Tu carrito está vacío.</p>
              <button
                onClick={onClose}
                className="mt-4 text-sm font-medium underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Ver productos
              </button>
            </div>
          ) : (
            cart.items.map((item, index) => (
              <div
                key={item.varianteId}
                className="flex gap-3 stagger-item"
                style={{ '--stagger-delay': `${index * 60}ms` } as React.CSSProperties}
              >
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(item.imagenUrl)}
                    alt={item.nombreProducto}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.nombreProducto}
                  </p>
                  {item.nombreVariante && (
                    <p className="text-xs text-gray-500">{item.nombreVariante}</p>
                  )}
                  <p className="text-sm font-bold mt-1">
                    {formatPrice(item.precio * item.cantidad, monedaSimbolo)}
                  </p>
                  {/* Qty controls */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => handleQtyChange(item.varianteId, item.cantidad - 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-5 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => handleQtyChange(item.varianteId, item.cantidad + 1)}
                      disabled={item.cantidad >= item.stock}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-40"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.varianteId)}
                  className="text-gray-400 hover:text-red-500 transition-colors self-start mt-1"
                  aria-label="Eliminar producto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            <div className="flex justify-between text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total, monedaSimbolo)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full text-center text-white font-medium py-3 rounded-lg transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Ir a pagar
            </Link>
            <Link
              href="/carrito"
              onClick={onClose}
              className="block w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Ver carrito completo
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
