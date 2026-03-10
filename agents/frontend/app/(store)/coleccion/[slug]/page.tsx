'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { storeApi } from '@/lib/api';
import type { Coleccion, Product } from '@/types';
import ProductGrid from '@/components/store/ProductGrid';
import { getImageUrl } from '@/lib/utils';

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

function BannerSkeleton() {
  return <div className="w-full h-48 sm:h-64 bg-gray-200 rounded-xl animate-pulse mb-6" />;
}

export default function ColeccionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [coleccion, setColeccion] = useState<Coleccion | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColeccion = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await storeApi.getColeccion(slug);
      const { productos, ...col } = res.data;
      setColeccion(col);
      setProducts(productos ?? []);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        setError('Esta colección no existe o no está disponible.');
      } else {
        setError('No se pudo cargar la colección. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchColeccion();
  }, [slug]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <Link href="/" className="hover:text-gray-800 transition-colors">Inicio</Link>
        <span>/</span>
        <span className="hover:text-gray-800 transition-colors">Colecciones</span>
        {coleccion && (
          <>
            <span>/</span>
            <span className="text-gray-900 font-medium">{coleccion.nombre}</span>
          </>
        )}
      </nav>

      {/* Banner image */}
      {loading ? (
        <BannerSkeleton />
      ) : coleccion?.imagenUrl ? (
        <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-6">
          <img
            src={getImageUrl(coleccion.imagenUrl)}
            alt={coleccion.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      {/* Title & description */}
      {loading ? (
        <div className="mb-6 space-y-2 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      ) : coleccion ? (
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{coleccion.nombre}</h1>
          {coleccion.descripcion && (
            <p className="mt-1 text-gray-500 text-sm sm:text-base">{coleccion.descripcion}</p>
          )}
        </div>
      ) : null}

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchColeccion}
            className="text-sm underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Reintentar
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 opacity-30" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          <p className="text-xl font-semibold text-gray-500 mb-2">Colección sin productos</p>
          <p className="text-sm">Esta colección no tiene productos disponibles por el momento.</p>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
