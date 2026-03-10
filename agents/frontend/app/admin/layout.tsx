'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, Tag, Layers, Percent } from 'lucide-react';
import { extractAuthParams, initSession, cleanAuthParams, isAuthenticated, removeSession } from '@/lib/auth';
import Spinner from '@/components/ui/Spinner';

const NAV_ITEMS = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/categorias', label: 'Categorías', icon: Tag },
  { href: '/admin/colecciones', label: 'Colecciones', icon: Layers },
  { href: '/admin/promociones', label: 'Promociones', icon: Percent },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

const PORTAL_URL = 'https://portal-clientes.operly.tech';

function comesFromPortal(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (document.referrer.startsWith(PORTAL_URL)) return true;
    if (window !== window.top) return true;
    return false;
  } catch {
    return true; // cross-origin iframe → asumir válido
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const params = extractAuthParams();
    if (params) {
      initSession(params);
      cleanAuthParams();
    }

    if (!isAuthenticated()) {
      window.location.href = PORTAL_URL;
      return;
    }

    if (!params && !comesFromPortal()) {
      removeSession();
      window.location.href = PORTAL_URL;
      return;
    }

    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none h-12">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  style={active ? { backgroundColor: 'var(--color-primary)' } : {}}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
