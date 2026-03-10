'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { storeApi } from '@/lib/api';
import { applyThemeColor } from '@/lib/utils';
import type { StoreConfig, Product } from '@/types';
import HeroSection from '@/components/store/HeroSection';
import PromotionsCarousel from '@/components/store/PromotionsCarousel';
import ProductGrid from '@/components/store/ProductGrid';
import Spinner from '@/components/ui/Spinner';

export default function HomePageClient() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    storeApi.getConfig().then((r) => {
      setConfig(r.data);
      if (r.data.colorPrimario) applyThemeColor(r.data.colorPrimario);
    }).catch(() => {});

    storeApi.getProducts({ destacado: true, limit: 8 }).then((r) => {
      setFeatured(r.data);
    }).catch(() => {}).finally(() => setLoadingFeatured(false));
  }, []);

  const promocionesActivas = config?.promociones?.filter((p) => p.activa) ?? [];

  return (
    <div>
      {/* Hero — only renders if content is configured */}
      {config && <HeroSection config={config} />}

      {/* Promotions Carousel */}
      {promocionesActivas.length > 0 && (
        <PromotionsCarousel promociones={config!.promociones!} />
      )}

      {/* Section separator */}
      {(config || promocionesActivas.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-gray-100" />
        </div>
      )}

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 animate-fade-in-up">
        {/* Section heading with decorative line */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Productos destacados</h2>
            <div
              className="mt-2 h-1 w-14 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          </div>
          <Link
            href="/productos"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border-2 transition-all duration-200 hover:shadow-md active:scale-95"
            style={{
              color: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
            }}
          >
            Ver todos <ArrowRight size={15} />
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>No hay productos destacados aún.</p>
            <Link href="/productos" className="mt-3 inline-block text-sm underline" style={{ color: 'var(--color-primary)' }}>
              Ver todos los productos
            </Link>
          </div>
        ) : (
          <ProductGrid products={featured} />
        )}
      </section>

      {/* Call-to-action band */}
      {!loadingFeatured && featured.length > 0 && (
        <section className="py-12 sm:py-16 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-2xl px-8 py-10 text-center text-white shadow-lg"
              style={{ background: 'var(--color-gradient, var(--color-primary))' }}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                Explora todo nuestro catálogo
              </h3>
              <p className="text-white/80 text-sm mb-6">
                Encuentra exactamente lo que buscas entre todos nuestros productos disponibles.
              </p>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-200 hover:shadow-xl active:scale-95"
                style={{ color: 'var(--color-primary)' }}
              >
                Ver catálogo completo <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
