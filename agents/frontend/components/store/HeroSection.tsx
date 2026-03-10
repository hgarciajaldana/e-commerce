'use client';

import Link from 'next/link';
import type { StoreConfig } from '@/types';
import { getImageUrl } from '@/lib/utils';

interface HeroSectionProps {
  config: StoreConfig;
}

export default function HeroSection({ config }: HeroSectionProps) {
  const tipo = config.heroTipo || 'color';
  const titulo = config.heroTitulo || '';
  const subtitulo = config.heroSubtitulo || '';
  const ctaTexto = config.heroCtaTexto || '';
  const ctaUrl = config.heroCtaUrl || '/productos';

  // If no content was configured, skip the hero entirely
  const hasContent = titulo || subtitulo || ctaTexto || (tipo === 'imagen' && config.bannerUrl);
  if (!hasContent) return null;

  // Text position
  const textPos = config.heroTextPos ?? 'center';
  const outerJustify = textPos === 'left' ? 'justify-start' : textPos === 'right' ? 'justify-end' : 'justify-center';
  const innerClass = textPos === 'left'
    ? 'items-start text-left pl-10 sm:pl-16 pr-6'
    : textPos === 'right'
    ? 'items-end text-right pr-10 sm:pr-16 pl-6'
    : 'items-center text-center px-6 mx-auto';

  // Build background style
  let backgroundStyle: React.CSSProperties = {};

  if (tipo === 'imagen' && config.bannerUrl) {
    backgroundStyle = {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${getImageUrl(config.bannerUrl)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  } else if (tipo === 'gradiente' && config.colorSecundario) {
    const angle = config.gradienteAngulo ?? 135;
    backgroundStyle = {
      background: `linear-gradient(${angle}deg, ${config.colorPrimario}, ${config.colorSecundario})`,
    };
  } else {
    backgroundStyle = {
      backgroundColor: config.colorPrimario || 'var(--color-primary)',
    };
  }

  return (
    <section
      className={`relative flex items-center ${outerJustify} text-white animate-fade-in`}
      style={{ minHeight: '420px', ...backgroundStyle }}
    >
      <div className={`relative z-10 max-w-3xl flex flex-col py-16 ${innerClass}`}>
        {titulo && (
          <h1 className="animate-fade-in-up text-4xl sm:text-5xl font-extrabold leading-tight mb-4 drop-shadow-sm"
            style={{ animationDelay: '100ms' }}
          >
            {titulo}
          </h1>
        )}
        {subtitulo && (
          <p
            className={`animate-fade-in-up text-lg sm:text-xl text-white/90 mb-8 max-w-xl${textPos === 'center' ? ' mx-auto' : ''}`}
            style={{ animationDelay: '250ms' }}
          >
            {subtitulo}
          </p>
        )}
        {ctaTexto && (
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Link
              href={ctaUrl}
              className="inline-block px-8 py-3 rounded-full font-semibold text-base bg-white transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 shadow-md"
              style={{ color: config.colorPrimario || 'var(--color-primary)' }}
            >
              {ctaTexto}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
