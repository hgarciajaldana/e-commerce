'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { storeApi } from '@/lib/api';
import type { Product, ProductWithVariants } from '@/types';
import ProductForm from '@/components/admin/ProductForm';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

export default function EditarProductoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductWithVariants | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    storeApi
      .getProduct(id)
      .then((res) => setProduct(res.data))
      .catch(() => setError('No se pudo cargar el producto.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSuccess = (updated: Product) => {
    router.push('/admin/productos');
  };

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Volver a productos
      </Link>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {loading ? 'Cargando...' : product ? `Editar: ${product.nombre}` : 'Editar producto'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">Modifica los datos del producto</p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle size={36} className="text-red-400 mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.push('/admin/productos')}>
            Volver a productos
          </Button>
        </div>
      )}

      {!loading && !error && product && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ProductForm
            product={product}
            onSuccess={handleSuccess}
            onCancel={() => router.push('/admin/productos')}
          />
        </div>
      )}
    </div>
  );
}
