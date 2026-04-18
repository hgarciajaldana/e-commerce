/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    // En producción, agregar los dominios del CDN/almacenamiento de imágenes
    // remotePatterns: [{ protocol: 'https', hostname: '*.yourdomain.com' }]
  },

  // Headers para CORS en desarrollo
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          ],
        },
      ]
    }
    return []
  },

  // Habilitar source maps en producción para debugging
  productionBrowserSourceMaps: false,

  // Strict mode para detectar problemas en desarrollo
  reactStrictMode: true,

  // Variables de entorno públicas disponibles en el cliente
  // Configurar en .env.local:
  //   NEXT_PUBLIC_API_URL=http://localhost:8000
  //   NEXT_PUBLIC_APP_ENV=development
}

module.exports = nextConfig
