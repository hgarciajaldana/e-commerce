import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'Inicio',
  description: 'Bienvenido a nuestra tienda. Descubre productos destacados y ofertas especiales.',
  openGraph: {
    title: 'Inicio',
    description: 'Bienvenido a nuestra tienda. Descubre productos destacados y ofertas especiales.',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
