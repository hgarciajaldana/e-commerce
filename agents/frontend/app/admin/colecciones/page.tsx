'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Layers, X, Search, Check } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Coleccion, Product } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import ImageUpload from '@/components/ui/ImageUpload';
import { getImageUrl } from '@/lib/utils';

// ─── Coleccion Form Modal ─────────────────────────────────────────────────────

interface ColeccionFormProps {
  coleccion?: Coleccion;
  onSave: () => void;
  onClose: () => void;
}

function ColeccionForm({ coleccion, onSave, onClose }: ColeccionFormProps) {
  const isEdit = !!coleccion;
  const [nombre, setNombre] = useState(coleccion?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(coleccion?.descripcion ?? '');
  const [imagenUrl, setImagenUrl] = useState(coleccion?.imagenUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && coleccion) {
        await adminApi.updateColeccion(coleccion.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          imagenUrl: imagenUrl.trim() || null,
          version: coleccion.version,
        });
      } else {
        await adminApi.createColeccion({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          imagenUrl: imagenUrl.trim() || undefined,
        });
      }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la colección');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? 'Editar colección' : 'Nueva colección'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
          <Input
            label="Nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Temporada verano"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Descripción opcional..."
            />
          </div>
          <ImageUpload
            label="Imagen de la colección"
            value={imagenUrl || null}
            onChange={(url) => setImagenUrl(url)}
            onClear={() => setImagenUrl('')}
            aspectRatio="free"
            hint="Imagen representativa de la colección"
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>
              {isEdit ? 'Guardar cambios' : 'Crear colección'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Productos Modal ──────────────────────────────────────────────────────────

interface ProductosModalProps {
  coleccion: Coleccion;
  onClose: () => void;
}

function ProductosModal({ coleccion, onClose }: ProductosModalProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [colProducts, setColProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, colRes] = await Promise.all([
        adminApi.getProducts({ limit: 200 }),
        adminApi.getColeccionProductos(coleccion.id),
      ]);
      setAllProducts(allRes.data);
      setColProducts(colRes.data);
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [coleccion.id]);

  useEffect(() => { load(); }, [load]);

  const inCollection = (productId: string) => colProducts.some((p) => p.id === productId);

  const handleToggle = async (product: Product) => {
    setToggling(product.id);
    setError(null);
    try {
      if (inCollection(product.id)) {
        await adminApi.removeProductoColeccion(coleccion.id, product.id);
        setColProducts((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        await adminApi.addProductoColeccion(coleccion.id, product.id);
        setColProducts((prev) => [...prev, product]);
      }
    } catch {
      setError('Error al actualizar la colección');
    } finally {
      setToggling(null);
    }
  };

  const filtered = allProducts.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Productos en colección</h3>
            <p className="text-xs text-gray-400 mt-0.5">{coleccion.nombre}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size="md" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay productos</p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((product) => {
                const isIn = inCollection(product.id);
                const isToggling = toggling === product.id;
                const thumb = product.imagenes?.find((i) => i.esPrincipal) ?? product.imagenes?.[0];
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleToggle(product)}
                    disabled={isToggling}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors text-left ${
                      isIn
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-60`}
                  >
                    {thumb ? (
                      <img
                        src={getImageUrl(thumb.url)}
                        alt={product.nombre}
                        className="w-9 h-9 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-gray-100 rounded shrink-0 flex items-center justify-center text-gray-300">
                        <Layers size={14} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{product.nombre}</p>
                      <p className="text-xs text-gray-400">
                        {product.activo ? 'Activo' : 'Inactivo'} · Stock disponible
                      </p>
                    </div>
                    {isToggling ? (
                      <Spinner size="sm" />
                    ) : isIn ? (
                      <Check size={16} className="text-[var(--color-primary)] shrink-0" />
                    ) : (
                      <Plus size={16} className="text-gray-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            {colProducts.length} producto{colProducts.length !== 1 ? 's' : ''} en esta colección
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ColeccionesPage() {
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingColeccion, setEditingColeccion] = useState<Coleccion | undefined>(undefined);
  const [managingColeccion, setManagingColeccion] = useState<Coleccion | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminApi.getColecciones();
      setColecciones(res.data);
    } catch {
      setLoadError('No se pudieron cargar las colecciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => {
    setEditingColeccion(undefined);
    setShowForm(true);
  };

  const handleEdit = (col: Coleccion) => {
    setEditingColeccion(col);
    setShowForm(true);
  };

  const handleDelete = async (col: Coleccion) => {
    if (!confirm(`¿Eliminar la colección "${col.nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(col.id);
    try {
      await adminApi.deleteColeccion(col.id);
      setColecciones((prev) => prev.filter((c) => c.id !== col.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la colección');
    } finally {
      setDeleting(null);
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingColeccion(undefined);
    load();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingColeccion(undefined);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Colecciones</h2>
          <p className="text-sm text-gray-500 mt-1">Agrupa productos en colecciones temáticas o de temporada</p>
        </div>
        <Button onClick={handleNew}>
          <Plus size={15} />
          Nueva colección
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {loadError && !loading && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-gray-500 mb-4">{loadError}</p>
          <Button variant="outline" onClick={load}>Reintentar</Button>
        </div>
      )}

      {!loading && !loadError && colecciones.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
          <Layers size={40} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-1">Sin colecciones</p>
          <p className="text-sm text-gray-400 mb-4">Crea tu primera colección para agrupar productos</p>
          <Button onClick={handleNew}>
            <Plus size={15} />
            Nueva colección
          </Button>
        </div>
      )}

      {!loading && !loadError && colecciones.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colecciones.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col"
            >
              {col.imagenUrl ? (
                <img
                  src={getImageUrl(col.imagenUrl)}
                  alt={col.nombre}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-300">
                  <Layers size={32} />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{col.nombre}</p>
                  <span
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      col.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {col.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                {col.descripcion && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{col.descripcion}</p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setManagingColeccion(col)}
                    className="flex-1 text-xs text-[var(--color-primary)] font-medium hover:underline"
                  >
                    Gestionar productos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(col)}
                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(col)}
                    disabled={deleting === col.id}
                    className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Eliminar"
                  >
                    {deleting === col.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ColeccionForm
          coleccion={editingColeccion}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}

      {managingColeccion && (
        <ProductosModal
          coleccion={managingColeccion}
          onClose={() => setManagingColeccion(null)}
        />
      )}
    </div>
  );
}
