'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { Category } from '@/types';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create
  const [showCreate, setShowCreate] = useState(false);
  const [createNombre, setCreateNombre] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCategories({ limit: 100 });
      setCategories(res.data);
    } catch {
      setError('No se pudieron cargar las categorías.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNombre.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await adminApi.createCategory({
        nombre: createNombre.trim(),
        descripcion: createDesc.trim() || undefined,
      });
      setCategories((prev) => [...prev, res.data]);
      setShowCreate(false);
      setCreateNombre('');
      setCreateDesc('');
    } catch (err: unknown) {
      setCreateError((err as Error).message || 'Error al crear la categoría.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setEditNombre(cat.nombre);
    setEditDesc(cat.descripcion ?? '');
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editNombre.trim()) return;
    setSaving(true);
    setEditError(null);
    try {
      const res = await adminApi.updateCategory(editTarget.id, {
        nombre: editNombre.trim(),
        descripcion: editDesc.trim() || undefined,
        version: editTarget.version,
      });
      setCategories((prev) => prev.map((c) => (c.id === editTarget.id ? res.data : c)));
      setEditTarget(null);
    } catch (err: unknown) {
      setEditError((err as Error).message || 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Tag size={20} className="text-gray-400" />
            Categorías
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length} categoría{categories.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nueva categoría
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-600 mb-3">{error}</p>
          <Button variant="outline" onClick={fetchCategories}>
            Reintentar
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Tag size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm mb-4">No hay categorías creadas.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Crear primera categoría
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Descripción</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.descripcion ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva categoría"
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={createNombre}
              onChange={(e) => setCreateNombre(e.target.value)}
              placeholder="Nombre de la categoría"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Crear categoría
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Editar categoría"
        size="sm"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar categoría"
        size="sm"
      >
        <p className="text-sm text-gray-700 mb-6">
          ¿Estás seguro de que quieres eliminar{' '}
          <strong>{deleteTarget?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
