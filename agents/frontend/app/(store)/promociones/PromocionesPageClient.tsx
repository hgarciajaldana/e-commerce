'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { storeApi } from '@/lib/api';
import type { Product, PromocionEspecial, TipoPromocion } from '@/types';
import ProductGrid from '@/components/store/ProductGrid';
import { addItem } from '@/lib/cart';

const TIPO_LABELS: Record<TipoPromocion, string> = {
  dos_x_uno: '2x1',
  porcentaje: 'Descuento',
  bundle: 'Bundle',
};

const TIPO_COLORS: Record<TipoPromocion, string> = {
  dos_x_uno: 'bg-purple-100 text-purple-700',
  porcentaje: 'bg-blue-100 text-blue-700',
  bundle: 'bg-orange-100 text-orange-700',
};

function PromocionCard({ promo }: { promo: PromocionEspecial }) {
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      varianteId: `promo_${promo.id}`,
      productoId: `promo_${promo.id}`,
      nombreProducto: promo.nombre,
      nombreVariante: TIPO_LABELS[promo.tipo],
      precio: Number(promo.precio_final),
      imagenUrl: promo.imagen_url ?? undefined,
      cantidad: 1,
      stock: 999,
    });
    window.dispatchEvent(new Event('cart-updated'));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {promo.imagen_url ? (
          <img
            src={promo.imagen_url}
            alt={promo.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
        )}
        {/* Badge */}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold ${TIPO_COLORS[promo.tipo]}`}>
          {TIPO_LABELS[promo.tipo]}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{promo.nombre}</h3>
        {promo.descripcion && (
          <p className="text-xs text-gray-500 line-clamp-2">{promo.descripcion}</p>
        )}

        {/* Pricing */}
        <div className="flex items-end gap-2 mt-auto">
          <div>
            {promo.precio_original && (
              <p className="text-xs text-gray-400 line-through">
                ${Number(promo.precio_original).toLocaleString()}
              </p>
            )}
            <p className="text-base font-bold text-green-600">
              ${Number(promo.precio_final).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Add to cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full mt-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors text-white"
          style={{ backgroundColor: added ? '#16a34a' : 'var(--color-primary)' }}
        >
          {added ? '¡Agregado!' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
}

function PromocionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 sm:p-4 flex flex-col gap-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-20 mt-1" />
        <div className="h-8 bg-gray-200 rounded mt-1" />
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-2 sm:p-4 flex flex-col gap-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex items-end justify-between mt-2">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-7 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export default function PromocionesPageClient() {
  const [especiales, setEspeciales] = useState<PromocionEspecial[]>([]);
  const [loadingEspeciales, setLoadingEspeciales] = useState(true);
  const [errorEspeciales, setErrorEspeciales] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);

  const fetchEspeciales = async () => {
    setLoadingEspeciales(true);
    setErrorEspeciales(null);
    try {
      const res = await storeApi.getPromocionesEspeciales();
      setEspeciales(res.data);
    } catch {
      setErrorEspeciales('No se pudieron cargar las promociones especiales. Intenta de nuevo.');
    } finally {
      setLoadingEspeciales(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setErrorProducts(null);
    try {
      const res = await storeApi.getPromociones();
      setProducts(res.data);
    } catch {
      setErrorProducts('No se pudieron cargar los productos en oferta.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchEspeciales();
    fetchProducts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/" className="hover:text-gray-800 transition-colors">Inicio</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Promociones</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-8">Promociones</h1>

      {/* ── Sección 1: Promociones Especiales ── */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Promociones Especiales</h2>

        {loadingEspeciales ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => <PromocionSkeleton key={i} />)}
          </div>
        ) : errorEspeciales ? (
          <div className="text-center py-10">
            <p className="text-red-600 mb-3">{errorEspeciales}</p>
            <button
              onClick={fetchEspeciales}
              className="text-sm underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Reintentar
            </button>
          </div>
        ) : especiales.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
            <p className="font-medium">No hay promociones especiales activas</p>
            <p className="text-sm mt-1">Vuelve pronto para ver nuestras ofertas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {especiales.map((promo) => (
              <PromocionCard key={promo.id} promo={promo} />
            ))}
          </div>
        )}
      </section>

      {/* ── Sección 2: Productos en Oferta ── */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos en Oferta</h2>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : errorProducts ? (
          <div className="text-center py-10">
            <p className="text-red-600 mb-3">{errorProducts}</p>
            <button
              onClick={fetchProducts}
              className="text-sm underline"
              style={{ color: 'var(--color-primary)' }}
            >
              Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
            <p className="font-medium">No hay productos en oferta actualmente</p>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </div>
  );
}
