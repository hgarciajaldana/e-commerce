import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProductosPageClient from './ProductosPageClient';

export const metadata: Metadata = {
  title: 'Catálogo de Productos',
  description: 'Explora nuestro catálogo completo de productos. Filtra por categoría y encuentra lo que buscas.',
  openGraph: {
    title: 'Catálogo de Productos',
    description: 'Explora nuestro catálogo completo de productos.',
    type: 'website',
  },
};

export default function ProductosPage() {
  return (
    <Suspense>
      <ProductosPageClient />
    </Suspense>
  );
}
