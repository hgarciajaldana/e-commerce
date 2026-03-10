'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PromocionCarrusel, TextPos } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface PromotionsCarouselProps {
  promociones: PromocionCarrusel[];
}

const TEXT_POS_CLASSES: Record<TextPos, string> = {
  left:   'items-start text-left pl-10 sm:pl-16 pr-6',
  center: 'items-center text-center px-6',
  right:  'items-end text-right pr-10 sm:pr-16 pl-6',
};

export default function PromotionsCarousel({ promociones }: PromotionsCarouselProps) {
  const active = promociones.filter((p) => p.activa).sort((a, b) => a.orden - b.orden);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = active.length;

  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(next, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, paused, current]);

  if (total === 0) return null;

  const slideWidthPct = 100 / total;

  return (
    <section className="w-full overflow-hidden mt-16" aria-label="Promociones">
      <div
        className="relative select-none"
        style={{ height: '360px' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Track */}
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{
            width: `${total * 100}%`,
            transform: `translateX(-${current * slideWidthPct}%)`,
          }}
        >
          {active.map((promo) => {
            const pos = promo.textPos ?? 'center';
            const posClasses = TEXT_POS_CLASSES[pos];
            const btnText = promo.textoBoton?.trim() || 'Ver más';

            return (
              <div
                key={promo.id}
                className="relative h-full overflow-hidden"
                style={{ width: `${slideWidthPct}%` }}
              >
                {/* Capa 1: fondo desenfocado — misma imagen, llena el espacio */}
                <img
                  src={getImageUrl(promo.imagenUrl)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-110"
                  style={{ filter: 'blur(18px) brightness(0.45)' }}
                />
                {/* Capa 2: imagen principal completa sin recorte */}
                <img
                  src={getImageUrl(promo.imagenUrl)}
                  alt={promo.titulo}
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {/* Capa 3: gradiente suave de abajo para legibilidad del texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {/* Capa 4: contenido */}
                <div className={`absolute inset-0 flex flex-col justify-end pb-10 text-white ${posClasses}`}>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow max-w-xl">
                    {promo.titulo}
                  </h2>
                  {promo.subtitulo && (
                    <p className="text-base sm:text-lg text-white/85 mb-5 max-w-lg drop-shadow-sm">
                      {promo.subtitulo}
                    </p>
                  )}
                  {promo.enlace && (
                    <div>
                      <Link
                        href={promo.enlace}
                        className="inline-block px-6 py-2.5 rounded-full bg-white font-semibold text-sm hover:opacity-90 transition-opacity shadow"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {btnText}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors z-10"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors z-10"
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {active.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === current ? 'bg-white w-6' : 'bg-white/50 w-2'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
