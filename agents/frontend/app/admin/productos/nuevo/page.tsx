'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import type { Product } from '@/types';

export default function NuevoProductoPage() {
  const router = useRouter();

  const handleSuccess = (product: Product) => {
    router.push('/admin/productos');
  };

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Volver a productos
      </Link>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Nuevo producto</h2>
        <p className="text-sm text-gray-500 mt-1">Completa los datos para agregar un producto al catálogo</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ProductForm
          onSuccess={handleSuccess}
          onCancel={() => router.push('/admin/productos')}
        />
      </div>
    </div>
  );
}
