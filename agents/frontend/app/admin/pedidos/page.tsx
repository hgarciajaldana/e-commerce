'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, ChevronDown } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';

const ESTADOS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'procesando', label: 'En proceso' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async (p: number, e: OrderStatus | '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getOrders({ page: p, limit: 20, estado: e || undefined });
      setOrders(res.data);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setError('No se pudieron cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1, estado);
  }, [fetchOrders, estado]);

  const handleEstado = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as OrderStatus | '';
    setEstado(val);
    setPage(1);
    fetchOrders(1, val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={20} className="text-gray-400" />
            Pedidos
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} pedido{total !== 1 ? 's' : ''} en total</p>
        </div>

        {/* Filter */}
        <div className="relative">
          <select
            value={estado}
            onChange={handleEstado}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-20 text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay pedidos{estado ? ` con estado "${ORDER_STATUS_LABELS[estado]}"` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500"># Pedido</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      #{o.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.clienteNombre ?? '—'}</p>
                      {o.clienteTelefono && (
                        <p className="text-xs text-gray-400">{o.clienteTelefono}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {new Date(o.createdAt).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[o.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ORDER_STATUS_LABELS[o.estado] ?? o.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {formatPrice(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => fetchOrders(p, estado)}
          />
        </>
      )}
    </div>
  );
}
