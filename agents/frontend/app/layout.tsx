import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Tienda Online',
    template: '%s | Tienda Online',
  },
  description: 'Explora nuestros productos y ofertas especiales.',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Tienda Online',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
