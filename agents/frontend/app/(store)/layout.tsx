'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { storeApi } from '@/lib/api';
import { getCart, getCartCount } from '@/lib/cart';
import { applyThemeColor, getImageUrl } from '@/lib/utils';
import type { StoreConfig } from '@/types';
import CartDrawer from '@/components/store/CartDrawer';
import Providers from '@/components/store/Providers';

// Simple social icon SVGs (no external library)
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/promociones', label: 'Promociones' },
  { href: '/contacto', label: 'Contacto' },
];

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const cart = getCart();
    setCartCount(getCartCount(cart));
    const handleStorage = () => {
      const updated = getCart();
      setCartCount(getCartCount(updated));
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('cart-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart-updated', handleStorage);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    storeApi.getConfig().catch(() => null).then((configRes) => {
      if (configRes?.data) {
        const cfg = configRes.data;
        setConfig(cfg);
        if (cfg.colorPrimario) applyThemeColor(cfg.colorPrimario);
        // Apply gradient CSS variable if enabled
        if (cfg.gradienteActivo && cfg.colorSecundario) {
          const angle = cfg.gradienteAngulo ?? 135;
          document.documentElement.style.setProperty(
            '--color-gradient',
            `linear-gradient(${angle}deg, ${cfg.colorPrimario}, ${cfg.colorSecundario})`
          );
        }
        // Apply extra theme colors
        if (cfg.colorHeader) {
          document.documentElement.style.setProperty('--color-header', cfg.colorHeader);
        }
        if (cfg.colorFondo) {
          document.documentElement.style.setProperty('--color-fondo', cfg.colorFondo);
        }
        if (cfg.colorTexto) {
          document.documentElement.style.setProperty('--color-texto', cfg.colorTexto);
        }
      }
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/productos?busqueda=${encodeURIComponent(search.trim())}`;
    }
  };

  const isActive = (href: string) => pathname === href;

  const socialLinks = [
    { key: 'whatsapp', url: config?.whatsappNumero ? `https://wa.me/${config.whatsappNumero.replace(/\D/g, '')}` : null, Icon: WhatsAppIcon },
    { key: 'instagram', url: config?.instagram, Icon: InstagramIcon },
    { key: 'facebook', url: config?.facebook, Icon: FacebookIcon },
    { key: 'tiktok', url: config?.tiktok, Icon: TikTokIcon },
    { key: 'twitter', url: config?.twitter, Icon: TwitterIcon },
    { key: 'youtube', url: config?.youtube, Icon: YouTubeIcon },
  ].filter((s) => s.url);

  return (
    <Providers>
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-fondo, #ffffff)', color: 'var(--color-texto, inherit)' }}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b border-gray-200 transition-all duration-300 ${
          scrolled
            ? 'shadow-md backdrop-blur-md bg-white/85'
            : 'shadow-sm'
        }`}
        style={scrolled ? {} : { backgroundColor: 'var(--color-header, #ffffff)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 shrink-0 hover:opacity-80 transition-opacity duration-200">
              {config?.logoUrl ? (
                <img src={getImageUrl(config.logoUrl)} alt={config.tituloTienda} className="h-8 object-contain" />
              ) : (
                <span style={{ color: 'var(--color-primary)' }}>
                  {config?.tituloTienda || 'Tienda'}
                </span>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(href)
                      ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Search + Cart */}
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="hidden sm:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-44"
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </form>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors hover:scale-110 active:scale-95 transform duration-150"
                aria-label="Carrito de compras"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center font-bold animate-scale-in"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              <button
                className="md:hidden p-2 text-gray-700"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menú"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden border-t border-gray-200 px-4 py-3 space-y-1"
            style={{ backgroundColor: 'var(--color-header, #ffffff)' }}
          >
            <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none"
              />
              <button type="submit" className="p-1.5 text-gray-600">
                <Search size={16} />
              </button>
            </form>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block py-2 px-2 rounded-md text-sm font-medium ${
                  isActive(href) ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-gray-700'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Brand */}
            <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
              {config?.tituloTienda || 'Tienda'}
            </span>
            {config?.descripcionTienda && (
              <p className="text-sm text-gray-500 max-w-md">{config.descripcionTienda}</p>
            )}

            {/* Nav links */}
            <nav className="flex gap-4 text-sm text-gray-500">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className="hover:text-gray-800 transition-colors">
                  {label}
                </Link>
              ))}
            </nav>

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map(({ key, url, Icon }) => (
                  <a
                    key={key}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} {config?.tituloTienda || 'Tienda'}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCartChange={(count) => setCartCount(count)}
        monedaSimbolo={config?.monedaSimbolo || '$'}
      />
    </div>
    </Providers>
  );
}
