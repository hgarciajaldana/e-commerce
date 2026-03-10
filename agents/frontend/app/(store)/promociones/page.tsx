import type { Metadata } from 'next';
import PromocionesPageClient from './PromocionesPageClient';

export const metadata: Metadata = {
  title: 'Promociones',
  description: 'Ofertas y promociones especiales. Aprovecha nuestros descuentos por tiempo limitado.',
  openGraph: {
    title: 'Promociones',
    description: 'Ofertas y promociones especiales en nuestra tienda.',
    type: 'website',
  },
};

export default function PromocionesPage() {
  return <PromocionesPageClient />;
}
