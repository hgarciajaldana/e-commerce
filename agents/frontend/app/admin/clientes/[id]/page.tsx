'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Mail, FileText, Save, ShoppingBag, X } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatPrice, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils';
import type { CustomerWithOrders, CustomerOrder } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerWithOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminApi
      .getCustomer(id)
      .then((res) => {
        setCustomer(res.data);
        setNombre(res.data.nombre ?? '');
        setEmail(res.data.email ?? '');
        setNotas(res.data.notas ?? '');
      })
      .catch(() => setError('No se pudo cargar el cliente.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await adminApi.updateCustomer(customer.id, {
        nombre: nombre.trim() || undefined,
        email: email.trim() || null,
        notas: notas.trim() || null,
      });
      setCustomer((prev) => prev ? { ...prev, ...res.data } : prev);
      setEditing(false);
    } catch {
      setSaveError('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNombre(customer?.nombre ?? '');
    setEmail(customer?.email ?? '');
    setNotas(customer?.notas ?? '');
    setSaveError(null);
    setEditing(false);
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  }
  if (error || !customer) {
    return (
      <div className="text-center py-24 text-red-600">
        <p>{error ?? 'Cliente no encontrado.'}</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-[var(--color-primary)] hover:underline">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/clientes')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={15} />
        Volver a clientes
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {(customer.nombre ?? customer.telefono).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{customer.nombre ?? 'Sin nombre'}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-gray-500">
                <span className="flex items-center gap-1"><Phone size={13} />{customer.telefono}</span>
                {customer.email && <span className="flex items-center gap-1"><Mail size={13} />{customer.email}</span>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{customer.totalPedidos}</p>
              <p className="text-xs text-gray-400 mt-0.5">Pedidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatPrice(customer.totalGastado)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total gastado</p>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          {!editing ? (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 text-sm text-gray-600">
                {customer.notas ? (
                  <p className="flex items-start gap-2">
                    <FileText size={14} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>{customer.notas}</span>
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs">Sin notas registradas.</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Editar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas sobre este cliente (solo visible para ti)..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} loading={saving}>
                  <Save size={14} />
                  Guardar
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X size={14} />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order history */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ShoppingBag size={15} className="text-gray-400" />
          Historial de pedidos
        </h3>

        {customer.pedidos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
            Este cliente aún no tiene pedidos.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {customer.pedidos.map((order: CustomerOrder) => (
                <div key={order.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
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
    </div>
  );
}
