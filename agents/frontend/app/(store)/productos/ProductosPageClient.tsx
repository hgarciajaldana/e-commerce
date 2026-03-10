'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { storeApi } from '@/lib/api';
import type { Product, Category } from '@/types';
import ProductGrid from '@/components/store/ProductGrid';
import Pagination from '@/components/ui/Pagination';

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <ArrowUp size={20} />
    </button>
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

export default function ProductosPageClient() {
  const searchParams = useSearchParams();
  const categoriaId = searchParams.get('categoriaId') || undefined;
  const busqueda = searchParams.get('busqueda') || undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(categoriaId);

  const fetchProducts = useCallback(
    async (p: number, catId?: string, search?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await storeApi.getProducts({ categoriaId: catId, busqueda: search, page: p, limit: 20 });
        setProducts(res.data);
        setTotalPages(res.totalPages);
        setPage(res.page);
      } catch {
        setError('No se pudieron cargar los productos. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    storeApi.getCategories().then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedCategory(categoriaId);
    fetchProducts(1, categoriaId, busqueda);
  }, [categoriaId, busqueda, fetchProducts]);

  const handleCategoryClick = (id?: string) => {
    setSelectedCategory(id);
    fetchProducts(1, id, busqueda);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('categoriaId', id);
    else url.searchParams.delete('categoriaId');
    window.history.pushState({}, '', url);
  };

  return (
    <>
    <ScrollToTop />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {busqueda ? `Resultados para: "${busqueda}"` : 'Catálogo de productos'}
        </h1>
        {!busqueda && (
          <p className="text-gray-500 text-sm mt-1">Explora toda nuestra colección</p>
        )}
        <div
          className="mt-2 h-1 w-14 rounded-full"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
      </div>

      {/* Category filter — horizontal scroll on mobile */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <button
            onClick={() => handleCategoryClick(undefined)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={!selectedCategory ? { backgroundColor: 'var(--color-primary)' } : {}}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedCategory === cat.id ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

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
            onClick={() => fetchProducts(page, selectedCategory, busqueda)}
            className="text-sm underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Reintentar
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 opacity-30" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p className="text-xl font-semibold text-gray-500 mb-2">Sin productos</p>
          <p className="text-sm">
            {busqueda
              ? `No encontramos resultados para "${busqueda}". Prueba con otros términos.`
              : 'No hay productos disponibles en esta categoría por el momento.'}
          </p>
        </div>
      ) : (
        <>
          <ProductGrid products={products} />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => fetchProducts(p, selectedCategory, busqueda)}
          />
        </>
      )}
    </div>
    </>
  );
}
