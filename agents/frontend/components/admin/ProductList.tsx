'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatPrice, getImageUrl } from '@/lib/utils';
import type { Product } from '@/types';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ProductForm from './ProductForm';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = useCallback(
    async (p: number, q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getProducts({ page: p, limit: 20, busqueda: q });
        setProducts(res.data);
        setPage(res.page);
        setTotalPages(res.totalPages);
      } catch {
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProducts(1, search);
  }, [fetchProducts, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      fetchProducts(page, search);
    } catch {
      // ignore — show error inline
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSuccess = (updated: Product) => {
    setEditProduct(null);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleToggleActivo = async (product: Product) => {
    setTogglingId(product.id);
    try {
      const res = await adminApi.updateProduct(product.id, {
        activo: !product.activo,
        version: product.version,
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? res.data : p)));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <Button type="submit" variant="outline" size="md">
            Buscar
          </Button>
        </form>
        <Link href="/admin/productos/nuevo">
          <Button>
            <Plus size={16} />
            Nuevo producto
          </Button>
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-600 mb-3">{error}</p>
          <Button variant="outline" onClick={() => fetchProducts(page, search)}>
            Reintentar
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-4">No hay productos{search ? ` para "${search}"` : ''}.</p>
          <Link href="/admin/productos/nuevo">
            <Button>
              <Plus size={16} />
              Crear primer producto
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Imagen</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Precio</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Categoría</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {products.map((p) => {
                  const mainImg = p.imagenes?.find((i) => i.esPrincipal) ?? p.imagenes?.[0];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={getImageUrl(mainImg?.url)}
                            alt={p.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.nombre}</p>
                        {p.destacado && (
                          <span className="text-xs text-[var(--color-primary)]">★ Destacado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {formatPrice(p.precio)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.categoria?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.activo ? 'success' : 'default'}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditProduct(p)}
                            className="text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleActivo(p)}
                            disabled={togglingId === p.id}
                            className={`transition-colors ${p.activo ? 'text-gray-400 hover:text-amber-500' : 'text-gray-300 hover:text-green-500'}`}
                            title={p.activo ? 'Inactivar' : 'Activar'}
                          >
                            {p.activo ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => fetchProducts(p, search)}
          />
        </>
      )}

      {/* Edit modal */}
      <Modal
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="Editar producto"
        size="lg"
      >
        {editProduct && (
          <ProductForm
            product={editProduct as Product & { variantes?: import('@/types').Variant[] }}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditProduct(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar producto"
        size="sm"
      >
        <p className="text-sm text-gray-700 mb-6">
          ¿Estás seguro de que quieres eliminar <strong>{deleteTarget?.nombre}</strong>? Esta acción
          no se puede deshacer.
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
