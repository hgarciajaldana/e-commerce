'use client';

import { useEffect, useState } from 'react';
import { extractAuthParams, initSession, cleanAuthParams, isAuthenticated, removeSession } from '@/lib/auth';
import Spinner from '@/components/ui/Spinner';

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

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);

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
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
