'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { storeApi } from '@/lib/api';
import { addItem } from '@/lib/cart';
import { formatPrice, getImageUrl } from '@/lib/utils';
import type { Product, ProductWithVariants, Variant } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { useToastContext } from '@/components/ui/Toast';
import ProductCard from '@/components/store/ProductCard';

export default function ProductoPageClient({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToastContext();

  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    storeApi
      .getProduct(id)
      .then((res) => {
        setProduct(res.data);
        const firstActive = res.data.variantes?.find((v) => v.activo && v.stock > 0);
        setSelectedVariant(firstActive ?? res.data.variantes?.[0] ?? null);
        const mainIdx = res.data.imagenes?.findIndex((i) => i.esPrincipal);
        setActiveImg(mainIdx >= 0 ? mainIdx : 0);
        if (res.data.categoriaId) {
          storeApi
            .getProducts({ categoriaId: res.data.categoriaId, limit: 5 })
            .then((r) => {
              const items = (r.data ?? []).filter((p) => p.id !== res.data.id).slice(0, 4);
              setRelated(items);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.error('[producto] Error cargando producto:', err);
        setError(err?.message || 'No se pudo cargar el producto.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    addItem({
      varianteId: selectedVariant.id,
      productoId: product.id,
      nombreProducto: product.nombre,
      nombreVariante: selectedVariant.nombre === 'Default' || selectedVariant.nombre === 'Único' ? '' : selectedVariant.nombre,
      precio: selectedVariant.precio ?? product.precio,
      cantidad: quantity,
      imagenUrl: product.imagenes?.[activeImg]?.url,
      stock: selectedVariant.stock,
    });
    window.dispatchEvent(new Event('cart-updated'));
    toast.show(`${product.nombre} agregado al carrito`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const effectivePrice = selectedVariant?.precio ?? product?.precio ?? 0;
  const maxQty = 99;
  const outOfStock = selectedVariant ? selectedVariant.stock === 0 : false;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-32">
        <p className="text-red-600 mb-4">{error ?? 'Producto no encontrado.'}</p>
        <button
          onClick={() => router.back()}
          className="text-sm underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
        <ChevronRight size={14} />
        <Link href="/productos" className="hover:text-gray-700 transition-colors">Productos</Link>
        <ChevronRight size={14} />
        <span className="text-gray-600 font-medium truncate max-w-[200px]">{product.nombre}</span>
      </nav>

      {(() => {
        const imgs = Array.from(new Map((product.imagenes || []).map((i) => [i.url, i])).values());
        return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
            <img
              src={getImageUrl(imgs[activeImg]?.url)}
              alt={product.nombre}
              className="w-full h-full object-cover"
            />
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imgs.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImg === idx ? 'border-[var(--color-primary)]' : 'border-transparent'
                  }`}
                >
                  <img
                    src={getImageUrl(img.url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.categoria && (
            <p className="text-sm text-gray-400 mb-1">{product.categoria.nombre}</p>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{product.nombre}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {formatPrice(effectivePrice)}
            </span>
            {product.precioComparacion && product.precioComparacion > product.precio && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.precioComparacion)}
              </span>
            )}
          </div>

          {product.descripcion && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.descripcion}</p>
          )}

          {/* Variants */}
          {product.variantes?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Variante</p>
              <div className="flex flex-wrap gap-2">
                {product.variantes
                  .filter((v) => v.activo)
                  .map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      disabled={v.stock === 0}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        selectedVariant?.id === v.id
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-gray-300 text-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {v.nombre}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <p className="text-sm font-medium text-gray-700">Cantidad</p>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                −
              </button>
              <span className="px-4 py-2 text-sm font-medium min-w-[2.5rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleAddToCart}
            className="w-full"
          >
            {added ? (
              <>
                <Check size={18} />
                Agregado al carrito
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                Agregar al carrito
              </>
            )}
          </Button>
        </div>
      </div>
        );
      })()}

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Productos relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
