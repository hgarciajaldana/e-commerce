'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, ChevronRight, Phone, Mail, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { Customer } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCustomers = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCustomers({ page: p, limit: 20, busqueda: q || undefined });
      setCustomers(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setPage(res.page);
    } catch {
      setError('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(1, '');
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setBusqueda(search);
    fetchCustomers(1, search);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-gray-400" />
            Clientes
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} cliente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-64"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-20 text-red-600">{error}</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {busqueda ? `No hay clientes que coincidan con "${busqueda}"` : 'Aún no hay clientes registrados.'}
          </p>
          {!busqueda && (
            <p className="text-xs mt-1 text-gray-400">Los clientes aparecen automáticamente cuando realizan un pedido.</p>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/admin/clientes/${c.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {(c.nombre ?? c.telefono).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {c.nombre ?? 'Sin nombre'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone size={10} />
                        {c.telefono}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail size={10} />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400">Pedidos</p>
                    <div className="flex items-center gap-1 justify-end">
                      <ShoppingBag size={12} className="text-gray-400" />
                      <span className="text-sm font-semibold text-gray-800">{c.totalPedidos}</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400">Total gastado</p>
                    <p className="text-sm font-semibold text-gray-800">{formatPrice(c.totalGastado)}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => { setPage(p); fetchCustomers(p, busqueda); }}
          />
        </>
      )}
    </div>
  );
}
