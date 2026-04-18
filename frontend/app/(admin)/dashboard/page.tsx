'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'

interface DashboardStats {
  totalProductos: number
  totalCategorias: number
  totalPedidos: number
  pedidosPendientes: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [productos, categorias, pedidos, pendientes] = await Promise.all([
          adminApi.getProducts({ limit: 1 }),
          adminApi.getCategories({ limit: 1 }),
          adminApi.getOrders({ limit: 1 }),
          adminApi.getOrders({ estado: 'pendiente', limit: 1 }),
        ])
        setStats({
          totalProductos: productos.total,
          totalCategorias: categorias.total,
          totalPedidos: pedidos.total,
          pedidosPendientes: pendientes.total,
        })
      } catch {
        // stats not critical, show zeros
        setStats({ totalProductos: 0, totalCategorias: 0, totalPedidos: 0, pedidosPendientes: 0 })
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const cards = [
    {
      label: 'Productos',
      value: stats?.totalProductos ?? '—',
      href: '/productos',
      color: 'bg-blue-50 text-blue-700',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
      ),
    },
    {
      label: 'Categorías',
      value: stats?.totalCategorias ?? '—',
      href: '/categorias',
      color: 'bg-purple-50 text-purple-700',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      ),
    },
    {
      label: 'Pedidos totales',
      value: stats?.totalPedidos ?? '—',
      href: '/pedidos',
      color: 'bg-green-50 text-green-700',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      ),
    },
    {
      label: 'Pedidos pendientes',
      value: stats?.pedidosPendientes ?? '—',
      href: '/pedidos?estado=pendiente',
      color: 'bg-yellow-50 text-yellow-700',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
        <p className="text-sm text-gray-500 mt-1">Resumen de tu tienda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="card p-5 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex items-center justify-center p-2 rounded-lg ${card.color} mb-3`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? (
                <span className="inline-block h-7 w-12 bg-gray-200 rounded animate-pulse" />
              ) : (
                card.value
              )}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/productos/nuevo" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="flex-shrink-0 p-3 bg-blue-600 rounded-lg text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Nuevo producto</p>
            <p className="text-xs text-gray-500">Agregar al catálogo</p>
          </div>
        </Link>

        <Link href="/pedidos" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="flex-shrink-0 p-3 bg-green-600 rounded-lg text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Ver pedidos</p>
            <p className="text-xs text-gray-500">Gestionar órdenes</p>
          </div>
        </Link>

        <Link href="/configuracion" className="card p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="flex-shrink-0 p-3 bg-gray-700 rounded-lg text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Configuración</p>
            <p className="text-xs text-gray-500">Ajustes de la tienda</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
