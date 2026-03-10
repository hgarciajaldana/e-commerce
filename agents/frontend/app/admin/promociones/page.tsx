'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { PromocionEspecial, TipoPromocion } from '@/types';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

const LIMIT = 20;

const TIPO_LABELS: Record<TipoPromocion, string> = {
  dos_x_uno: '2x1',
  porcentaje: 'Descuento %',
  bundle: 'Bundle',
};

const TIPO_COLORS: Record<TipoPromocion, string> = {
  dos_x_uno: 'bg-purple-100 text-purple-700',
  porcentaje: 'bg-blue-100 text-blue-700',
  bundle: 'bg-orange-100 text-orange-700',
};

interface FormState {
  nombre: string;
  descripcion: string;
  imagen_url: string;
  tipo: TipoPromocion;
  compra_cantidad: string;
  llevas_cantidad: string;
  porcentaje: string;
  precio_original: string;
  precio_final: string;
  activa: boolean;
  fecha_inicio: string;
  fecha_fin: string;
}

const EMPTY_FORM: FormState = {
  nombre: '',
  descripcion: '',
  imagen_url: '',
  tipo: 'porcentaje',
  compra_cantidad: '',
  llevas_cantidad: '',
  porcentaje: '',
  precio_original: '',
  precio_final: '',
  activa: true,
  fecha_inicio: '',
  fecha_fin: '',
};

function promoToForm(p: PromocionEspecial): FormState {
  return {
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    imagen_url: p.imagen_url ?? '',
    tipo: p.tipo,
    compra_cantidad: p.compra_cantidad != null ? String(p.compra_cantidad) : '',
    llevas_cantidad: p.llevas_cantidad != null ? String(p.llevas_cantidad) : '',
    porcentaje: p.porcentaje != null ? String(p.porcentaje) : '',
    precio_original: p.precio_original != null ? String(p.precio_original) : '',
    precio_final: String(p.precio_final),
    activa: p.activa,
    fecha_inicio: p.fecha_inicio ? p.fecha_inicio.substring(0, 10) : '',
    fecha_fin: p.fecha_fin ? p.fecha_fin.substring(0, 10) : '',
  };
}

export default function PromocionesAdminPage() {
  const [promos, setPromos] = useState<PromocionEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromocionEspecial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  // Toggle state
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminApi.getPromocionesEspeciales({ page: p, limit: LIMIT });
      setPromos(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch {
      setLoadError('No se pudieron cargar las promociones especiales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (promo: PromocionEspecial) => {
    setEditing(promo);
    setForm(promoToForm(promo));
    setSaveError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleField = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setSaveError('El nombre es requerido'); return; }
    if (!form.precio_final) { setSaveError('El precio final es requerido'); return; }

    setSaving(true);
    setSaveError(null);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || undefined,
      imagen_url: form.imagen_url.trim() || undefined,
      tipo: form.tipo,
      compra_cantidad: form.compra_cantidad ? Number(form.compra_cantidad) : undefined,
      llevas_cantidad: form.llevas_cantidad ? Number(form.llevas_cantidad) : undefined,
      porcentaje: form.porcentaje ? Number(form.porcentaje) : undefined,
      precio_original: form.precio_original ? Number(form.precio_original) : undefined,
      precio_final: Number(form.precio_final),
      activa: form.activa,
      fecha_inicio: form.fecha_inicio || undefined,
      fecha_fin: form.fecha_fin || undefined,
    };

    try {
      if (editing) {
        const res = await adminApi.updatePromocionEspecial(editing.id, { ...payload, version: editing.version });
        setPromos((prev) => prev.map((p) => p.id === editing.id ? res.data : p));
      } else {
        const res = await adminApi.createPromocionEspecial(payload as Parameters<typeof adminApi.createPromocionEspecial>[0]);
        setPromos((prev) => [res.data, ...prev]);
        setTotal((t) => t + 1);
      }
      closeModal();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo: PromocionEspecial) => {
    if (!window.confirm(`¿Eliminar la promoción "${promo.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(promo.id);
    try {
      await adminApi.deletePromocionEspecial(promo.id);
      setPromos((prev) => prev.filter((p) => p.id !== promo.id));
      setTotal((t) => t - 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActiva = async (promo: PromocionEspecial) => {
    if (toggling) return;
    const newValue = !promo.activa;
    setPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, activa: newValue } : p));
    setToggling(promo.id);
    try {
      const res = await adminApi.updatePromocionEspecial(promo.id, { activa: newValue, version: promo.version });
      setPromos((prev) => prev.map((p) => p.id === promo.id ? res.data : p));
    } catch (err: unknown) {
      setPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, activa: !newValue } : p));
      alert(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Promociones Especiales</h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona ofertas de tipo 2x1, descuento por porcentaje y bundles
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nueva Promoción
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {loadError && !loading && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-gray-500 mb-4">{loadError}</p>
          <Button variant="outline" onClick={() => load(page)}>Reintentar</Button>
        </div>
      )}

      {!loading && !loadError && promos.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <Tag size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-1">Sin promociones especiales</p>
          <p className="text-sm text-gray-400 mb-4">Crea tu primera promoción especial</p>
          <Button onClick={openCreate}><Plus size={14} />Nueva Promoción</Button>
        </div>
      )}

      {!loading && !loadError && promos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Promoción</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Precio Final</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Fechas</th>
                <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Activa</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promos.map((promo) => {
                const isDeleting = deleting === promo.id;
                const isToggling = toggling === promo.id;
                return (
                  <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {promo.imagen_url ? (
                          <img
                            src={promo.imagen_url}
                            alt={promo.nombre}
                            className="w-10 h-10 object-cover rounded-lg shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-gray-300">
                            <Package size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{promo.nombre}</p>
                          {promo.descripcion && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{promo.descripcion}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TIPO_COLORS[promo.tipo]}`}>
                        {TIPO_LABELS[promo.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {promo.precio_original && (
                          <p className="text-xs text-gray-400 line-through">
                            ${Number(promo.precio_original).toLocaleString()}
                          </p>
                        )}
                        <span className="text-sm font-semibold text-green-600">
                          ${Number(promo.precio_final).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">
                        {promo.fecha_inicio && (
                          <p>Desde: {new Date(promo.fecha_inicio).toLocaleDateString()}</p>
                        )}
                        {promo.fecha_fin && (
                          <p>Hasta: {new Date(promo.fecha_fin).toLocaleDateString()}</p>
                        )}
                        {!promo.fecha_inicio && !promo.fecha_fin && (
                          <span className="text-gray-300">Sin límite</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={promo.activa}
                        disabled={isToggling}
                        onClick={() => handleToggleActiva(promo)}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 ${
                          promo.activa ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            promo.activa ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                        {isToggling && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Spinner size="sm" />
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(promo)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(promo)}
                          disabled={isDeleting}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {isDeleting ? <Spinner size="sm" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !loadError && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages} · {total} promociones
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Anterior
            </Button>
            <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Promoción' : 'Nueva Promoción'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => handleField('nombre', e.target.value)}
                  placeholder="Ej: 2x1 en camisetas"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => handleField('descripcion', e.target.value)}
                  placeholder="Descripción opcional"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none"
                />
              </div>

              {/* Imagen URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                <input
                  type="url"
                  value={form.imagen_url}
                  onChange={(e) => handleField('imagen_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => handleField('tipo', e.target.value as TipoPromocion)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                >
                  <option value="porcentaje">Descuento por Porcentaje</option>
                  <option value="dos_x_uno">2x1 (Dos por uno)</option>
                  <option value="bundle">Bundle (Paquete)</option>
                </select>
              </div>

              {/* Campos condicionales: dos_x_uno */}
              {form.tipo === 'dos_x_uno' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compra cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={form.compra_cantidad}
                      onChange={(e) => handleField('compra_cantidad', e.target.value)}
                      placeholder="Ej: 2"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Llevas cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={form.llevas_cantidad}
                      onChange={(e) => handleField('llevas_cantidad', e.target.value)}
                      placeholder="Ej: 3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Campos condicionales: porcentaje */}
              {form.tipo === 'porcentaje' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.porcentaje}
                      onChange={(e) => handleField('porcentaje', e.target.value)}
                      placeholder="Ej: 20"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio original</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio_original}
                      onChange={(e) => handleField('precio_original', e.target.value)}
                      placeholder="Ej: 50000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio final <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio_final}
                      onChange={(e) => handleField('precio_final', e.target.value)}
                      placeholder="Ej: 40000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Campos condicionales: bundle */}
              {form.tipo === 'bundle' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio original</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio_original}
                      onChange={(e) => handleField('precio_original', e.target.value)}
                      placeholder="Ej: 150000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio final <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio_final}
                      onChange={(e) => handleField('precio_final', e.target.value)}
                      placeholder="Ej: 120000"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Precio final para dos_x_uno (siempre visible) */}
              {form.tipo === 'dos_x_uno' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio final <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio_final}
                    onChange={(e) => handleField('precio_final', e.target.value)}
                    placeholder="Precio del paquete"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={(e) => handleField('fecha_inicio', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={(e) => handleField('fecha_fin', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Activa toggle */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Activa</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.activa}
                  onClick={() => handleField('activa', !form.activa)}
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    form.activa ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.activa ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {saveError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" loading={saving} className="flex-1">
                  {editing ? 'Guardar cambios' : 'Crear promoción'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
