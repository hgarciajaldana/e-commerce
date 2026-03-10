'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, getImageUrl, truncate } from '@/lib/utils';
import { addItem } from '@/lib/cart';

interface ProductCardProps {
  product: Product;
  monedaSimbolo?: string;
}

const isDefaultVariant = (name: string) =>
  name === 'Default' || name === 'Único' || name === 'Unico';

export default function ProductCard({ product, monedaSimbolo = '$' }: ProductCardProps) {
  const mainImage = product.imagenes?.find((i) => i.esPrincipal) ?? product.imagenes?.[0];
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const activeVariants = product.variantes ?? [];
  const firstVariant = activeVariants[0];
  // Can add directly if there's at least one variant (single variant OR default/único)
  const canAddDirect =
    activeVariants.length > 0 &&
    (activeVariants.length === 1 || isDefaultVariant(firstVariant.nombre));

  const hasDiscount =
    product.precioComparacion && product.precioComparacion > product.precio;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant || !canAddDirect) {
      window.location.href = `/producto/${product.id}`;
      return;
    }
    addItem({
      varianteId: firstVariant.id,
      productoId: product.id,
      nombreProducto: product.nombre,
      nombreVariante: isDefaultVariant(firstVariant.nombre) ? '' : firstVariant.nombre,
      precio: Number(firstVariant.precio ?? product.precio),
      cantidad: qty,
      imagenUrl: mainImage?.url,
      stock: firstVariant.stock,
    });
    window.dispatchEvent(new Event('cart-updated'));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleQtyChange = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => Math.min(10, Math.max(1, q + delta)));
  };

  return (
    <Link
      href={`/producto/${product.id}`}
      className="group block bg-white rounded-xl border border-gray-100 ring-1 ring-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={getImageUrl(mainImage?.url)}
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />

        {product.destacado && (
          <span
            className="badge-pulse absolute top-2 left-2 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Destacado
          </span>
        )}
        {hasDiscount && (
          <span className="badge-pulse absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
            Oferta
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2 sm:p-4 flex flex-col gap-1">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2">
          {product.nombre}
        </h3>
        {product.descripcion && (
          <p className="text-xs text-gray-500 line-clamp-2 hidden sm:block">
            {truncate(product.descripcion, 80)}
          </p>
        )}

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="min-w-0">
            <span className="text-sm sm:text-base font-bold text-gray-900 block truncate">
              {formatPrice(product.precio, monedaSimbolo)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through block truncate">
                {formatPrice(product.precioComparacion!, monedaSimbolo)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canAddDirect && (
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={(e) => handleQtyChange(-1, e)}
                  className="px-1.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-xs active:scale-90"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span className="px-1.5 py-1 text-xs font-medium min-w-[1.25rem] text-center">
                  {qty}
                </span>
                <button
                  onClick={(e) => handleQtyChange(1, e)}
                  className="px-1.5 py-1 text-gray-600 hover:bg-gray-100 transition-colors text-xs active:scale-90"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1 text-white text-xs font-medium px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: added ? '#16a34a' : 'var(--color-primary)' }}
              aria-label="Agregar al carrito"
            >
              {added ? <Check size={13} /> : <ShoppingCart size={13} />}
              <span className="hidden sm:inline">{added ? '¡Listo!' : 'Agregar'}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
