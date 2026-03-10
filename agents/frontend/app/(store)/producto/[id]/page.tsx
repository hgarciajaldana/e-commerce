import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ProductoPageClient from './ProductoPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const cookieStore = cookies();
  const slug = cookieStore.get('x-empresa-slug')?.value;

  try {
    const headers: Record<string, string> = {};
    if (slug) headers['x-empresa-slug'] = slug;

    const res = await fetch(`${API_URL}/api/v1/store/products/${params.id}`, {
      headers,
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error('not found');

    const json = await res.json();
    const product = json.data ?? json;

    const title: string = product.nombre ?? 'Producto';
    const description: string =
      product.descripcion?.slice(0, 155) ?? 'Ver detalles del producto en nuestra tienda.';
    const imagenPrincipal =
      product.imagenes?.find((i: { esPrincipal?: boolean; url: string }) => i.esPrincipal) ??
      product.imagenes?.[0];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        ...(imagenPrincipal?.url ? { images: [{ url: imagenPrincipal.url }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(imagenPrincipal?.url ? { images: [imagenPrincipal.url] } : {}),
      },
    };
  } catch {
    return {
      title: 'Producto',
      description: 'Ver detalles del producto en nuestra tienda.',
    };
  }
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductoPageClient id={params.id} />;
}
