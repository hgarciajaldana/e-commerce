'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingBag, DollarSign, Clock, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils';
import type { Order, Product } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';

interface DashboardMetrics {
  totalProductos: number;
  productosActivos: number;
  totalPedidos: number;
  pedidosPendientes: number;
  ingresoTotal: number;
  ultimosPedidos: Order[];
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, ordersRes] = await Promise.all([
          adminApi.getProducts({ limit: 1 }),
          adminApi.getOrders({ limit: 5 }),
        ]);

        const [activeProductsRes, pendingOrdersRes, allOrdersRes] = await Promise.all([
          adminApi.getProducts({ activo: true, limit: 1 }),
          adminApi.getOrders({ estado: 'pendiente', limit: 1 }),
          adminApi.getOrders({ limit: 100 }),
        ]);

        const ingresoTotal = allOrdersRes.data.reduce((sum, o) => sum + o.total, 0);

        setMetrics({
          totalProductos: productsRes.total,
          productosActivos: activeProductsRes.total,
          totalPedidos: ordersRes.total,
          pedidosPendientes: pendingOrdersRes.total,
          ingresoTotal,
          ultimosPedidos: ordersRes.data,
        });
      } catch {
        setError('No se pudieron cargar las métricas. Verifica tu conexión.');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={40} className="text-red-400 mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-sm text-gray-500">Resumen general de tu tienda</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total productos"
          value={metrics.totalProductos}
          subtitle={`${metrics.productosActivos} activos`}
          icon={Package}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total pedidos"
          value={metrics.totalPedidos}
          subtitle="Todos los tiempos"
          icon={ShoppingBag}
          color="bg-violet-500"
        />
        <MetricCard
          title="Pedidos pendientes"
          value={metrics.pedidosPendientes}
          subtitle="Requieren atención"
          icon={Clock}
          color="bg-amber-500"
        />
        <MetricCard
          title="Ingresos totales"
          value={formatPrice(metrics.ingresoTotal)}
          subtitle="Todos los pedidos"
          icon={DollarSign}
          color="bg-emerald-500"
        />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Últimos pedidos</h3>
          </div>
          <Link
            href="/admin/pedidos"
            className="text-xs text-[var(--color-primary)] hover:underline font-medium"
          >
            Ver todos
          </Link>
        </div>

        {metrics.ultimosPedidos.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Aún no hay pedidos.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {metrics.ultimosPedidos.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.numeroPedido}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{order.clienteNombre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ORDER_STATUS_COLORS[order.estado] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.estado] ?? order.estado}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/productos/nuevo"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <Package size={20} className="text-gray-400 group-hover:text-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Nuevo producto</p>
              <p className="text-xs text-gray-400 mt-0.5">Agregar al catálogo</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/clientes"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <Users size={20} className="text-gray-400 group-hover:text-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Clientes</p>
              <p className="text-xs text-gray-400 mt-0.5">Ver y editar clientes</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/configuracion"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-gray-400 group-hover:text-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Configurar tienda</p>
              <p className="text-xs text-gray-400 mt-0.5">WhatsApp, logo, colores</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
