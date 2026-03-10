'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, Link as LinkIcon, X } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import type { Category, Product, Variant } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';

interface ProductFormProps {
  product?: Product & { variantes?: Variant[] };
  onSuccess: (product: Product) => void;
  onCancel?: () => void;
}

interface VariantRow {
  id?: string;
  nombre: string;
  sku: string;
  precio: string;
  stock: string;
  activo: boolean;
  version?: number;
  isNew: boolean;
}

interface ImageRow {
  id?: string;
  url: string;
  esPrincipal: boolean;
  isUploading?: boolean;
  archivoId?: string;
  file?: File; // stored for deferred upload on new products
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEdit = !!product;

  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base fields
  const [nombre, setNombre] = useState(product?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(product?.descripcion ?? '');
  const [precio, setPrecio] = useState(product?.precio?.toString() ?? '');
  const [precioComparacion, setPrecioComparacion] = useState(
    product?.precioComparacion?.toString() ?? ''
  );
  const [categoriaId, setCategoriaId] = useState(product?.categoriaId ?? '');
  const [destacado, setDestacado] = useState(product?.destacado ?? false);
  const [enPromocion, setEnPromocion] = useState(product?.en_promocion ?? false);
  const [activo, setActivo] = useState(product?.activo ?? true);

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>(() => {
    if (product?.variantes && product.variantes.length > 0) {
      return product.variantes.map((v) => ({
        id: v.id,
        nombre: v.nombre,
        sku: v.sku ?? '',
        precio: v.precio?.toString() ?? '',
        stock: v.stock.toString(),
        activo: v.activo ?? true,
        version: v.version ?? 0,
        isNew: false,
      }));
    }
    return [{ nombre: 'Único', sku: '', precio: '', stock: '0', activo: true, isNew: true }];
  });

  // Images
  const [images, setImages] = useState<ImageRow[]>(() =>
    product?.imagenes?.map((img) => ({
      id: img.id,
      url: img.url,
      esPrincipal: img.esPrincipal,
    })) ?? []
  );
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    adminApi.getCategories({ limit: 100 }).then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  // Re-populate all form fields when product changes (handles Decimal → number coercion and
  // ensures images/variants always reflect the loaded product, not stale useState init values).
  useEffect(() => {
    if (!product) return;
    setNombre(product.nombre ?? '');
    setDescripcion(product.descripcion ?? '');
    setPrecio(product.precio != null ? Number(product.precio).toString() : '');
    setPrecioComparacion(
      product.precioComparacion != null ? Number(product.precioComparacion).toString() : ''
    );
    setCategoriaId(product.categoriaId ?? '');
    setDestacado(product.destacado ?? false);
    setEnPromocion(product.en_promocion ?? false);
    setActivo(product.activo ?? true);
    setImages(
      product.imagenes?.map((img) => ({
        id: img.id,
        url: img.url,
        esPrincipal: img.esPrincipal,
      })) ?? []
    );
    if (product.variantes && product.variantes.length > 0) {
      setVariants(
        product.variantes.map((v) => ({
          id: v.id,
          nombre: v.nombre,
          sku: (v as Variant).sku ?? '',
          precio: v.precio != null ? Number(v.precio).toString() : '',
          stock: v.stock.toString(),
          activo: (v as Variant).activo ?? true,
          version: (v as Variant).version,
          isNew: false,
        }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Variants helpers
  const addVariant = () => {
    setVariants((v) => [
      ...v,
      { nombre: '', sku: '', precio: '', stock: '0', activo: true, isNew: true },
    ]);
  };

  const updateVariant = (idx: number, field: keyof VariantRow, value: string | boolean) => {
    setVariants((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const removeVariant = (idx: number) => {
    setVariants((rows) => rows.filter((_, i) => i !== idx));
  };

  // Image helpers
  const handleImageUpload = async (file: File) => {
    if (!isEdit || !product) {
      // Store File for deferred upload after product creation
      const objectUrl = URL.createObjectURL(file);
      setImages((imgs) => [
        ...imgs,
        { url: objectUrl, esPrincipal: imgs.length === 0, isUploading: false, file },
      ]);
      return;
    }
    const placeholder: ImageRow = { url: '', esPrincipal: images.length === 0, isUploading: true };
    setImages((imgs) => [...imgs, placeholder]);
    try {
      const res = await adminApi.uploadImage(product.id, file);
      setImages((imgs) =>
        imgs.map((img, i) =>
          i === imgs.length - 1
            ? { url: res.url, esPrincipal: img.esPrincipal, archivoId: res.archivoId }
            : img
        )
      );
    } catch {
      setImages((imgs) => imgs.filter((_, i) => i !== imgs.length - 1));
      setError('No se pudo subir la imagen.');
    }
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setImages((imgs) => [
      ...imgs,
      { url, esPrincipal: imgs.length === 0 },
    ]);
    setImageUrlInput('');
  };

  const removeImage = async (idx: number) => {
    const img = images[idx];
    if (isEdit && product && img.archivoId) {
      try {
        await adminApi.deleteImage(product.id, img.archivoId);
      } catch {
        // Continue
      }
    }
    setImages((imgs) => imgs.filter((_, i) => i !== idx));
  };

  const setPrincipal = (idx: number) => {
    setImages((imgs) => imgs.map((img, i) => ({ ...img, esPrincipal: i === idx })));
  };

  // Validation
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!precio || isNaN(Number(precio)) || Number(precio) < 0)
      e.precio = 'Ingresa un precio válido';
    variants.forEach((v, i) => {
      if (!v.nombre.trim()) e[`v_nombre_${i}`] = 'Nombre requerido';
      if (v.stock === '' || isNaN(Number(v.stock)) || Number(v.stock) < 0)
        e[`v_stock_${i}`] = 'Stock inválido';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError(null);

    try {
      let savedProduct: Product;

      if (isEdit) {
        const res = await adminApi.updateProduct(product!.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          precio: Number(precio),
          precioComparacion: precioComparacion ? Number(precioComparacion) : undefined,
          categoriaId: categoriaId || undefined,
          destacado,
          en_promocion: enPromocion,
          activo,
          version: product!.version,
        });
        savedProduct = res.data;
      } else {
        const res = await adminApi.createProduct({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          precio: Number(precio),
          categoriaId: categoriaId || undefined,
          destacado,
          en_promocion: enPromocion,
        });
        savedProduct = res.data;
      }

      // Handle variants
      for (const v of variants) {
        if (v.isNew) {
          await adminApi.createVariant(savedProduct.id, {
            nombre: v.nombre.trim(),
            sku: v.sku.trim() || undefined,
            precio: v.precio ? Number(v.precio) : undefined,
            stock: Number(v.stock),
          });
        } else if (v.id) {
          await adminApi.updateVariant(savedProduct.id, v.id, {
            nombre: v.nombre.trim(),
            sku: v.sku.trim() || undefined,
            precio: v.precio ? Number(v.precio) : undefined,
            stock: Number(v.stock),
            activo: v.activo,
            version: v.version ?? 1,
          });
        }
      }

      // Upload file images for new product (deferred)
      if (!isEdit) {
        for (const img of images) {
          if (img.file) {
            try {
              await adminApi.uploadImage(savedProduct.id, img.file);
            } catch {
              // Non-fatal: product was created, image upload failed
            }
          } else if (img.url && !img.url.startsWith('blob:')) {
            // URL-type image: save via API
            try {
              await adminApi.addImageUrl(savedProduct.id, img.url);
            } catch {
              // Non-fatal
            }
          }
        }
      }

      onSuccess(savedProduct);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el producto';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input
            label="Nombre del producto"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errors.nombre}
            placeholder="Ej: Remera básica"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            placeholder="Descripción del producto..."
          />
        </div>

        <Input
          label="Precio"
          required
          type="number"
          min="0"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          error={errors.precio}
          placeholder="0.00"
        />

        <Input
          label="Precio de comparación (tachado)"
          type="number"
          min="0"
          step="0.01"
          value={precioComparacion}
          onChange={(e) => setPrecioComparacion(e.target.value)}
          placeholder="0.00"
          hint="Si es mayor al precio, se muestra como oferta"
        />

        <Select
          label="Categoría"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          placeholder="Sin categoría"
          options={categories.map((c) => ({ value: c.id, label: c.nombre }))}
        />

        <div className="flex items-end gap-6 pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={destacado}
              onChange={(e) => setDestacado(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--color-primary)]"
            />
            <span className="text-sm font-medium text-gray-700">Destacado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enPromocion}
              onChange={(e) => setEnPromocion(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--color-primary)]"
            />
            <span className="text-sm font-medium text-gray-700">En promoción</span>
          </label>
          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--color-primary)]"
              />
              <span className="text-sm font-medium text-gray-700">Activo</span>
            </label>
          )}
        </div>
      </div>

      {/* Images */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Imágenes</p>
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group w-20 h-20">
              {img.isUploading ? (
                <div className="w-full h-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <Spinner size="sm" />
                </div>
              ) : (
                <>
                  <img
                    src={getImageUrl(img.url)}
                    alt=""
                    className={`w-full h-full object-cover rounded-lg border-2 ${
                      img.esPrincipal ? 'border-[var(--color-primary)]' : 'border-gray-200'
                    }`}
                  />
                  <div className="absolute inset-0 hidden group-hover:flex flex-col items-center justify-center gap-1 bg-black/40 rounded-lg">
                    {!img.esPrincipal && (
                      <button
                        type="button"
                        onClick={() => setPrincipal(idx)}
                        className="text-xs text-white bg-black/50 px-1.5 py-0.5 rounded"
                      >
                        Principal
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-white bg-red-500/80 p-1 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {img.esPrincipal && (
                    <span className="absolute top-0.5 left-0.5 text-[10px] bg-[var(--color-primary)] text-white px-1 rounded">
                      Principal
                    </span>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Upload button */}
          <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-primary)] transition-colors text-gray-400 hover:text-[var(--color-primary)]">
            <Upload size={18} />
            <span className="text-[10px] mt-1">Subir</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {/* URL input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="O pega una URL de imagen..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl(); } }}
            />
          </div>
          <Button type="button" variant="outline" onClick={handleAddImageUrl} size="md">
            <LinkIcon size={14} />
            Agregar
          </Button>
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Variantes</p>
          <Button type="button" variant="ghost" size="sm" onClick={addVariant}>
            <Plus size={14} />
            Agregar variante
          </Button>
        </div>
        <div className="space-y-3">
          {variants.map((v, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-start bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
              <div className="col-span-4">
                <Input
                  placeholder="Nombre (Ej: Talle M)"
                  value={v.nombre}
                  onChange={(e) => updateVariant(idx, 'nombre', e.target.value)}
                  error={errors[`v_nombre_${idx}`]}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={v.precio}
                  onChange={(e) => updateVariant(idx, 'precio', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Stock"
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                  error={errors[`v_stock_${idx}`]}
                />
              </div>
              <div className="col-span-1 flex items-center justify-center pt-2">
                <input
                  type="checkbox"
                  checked={v.activo}
                  onChange={(e) => updateVariant(idx, 'activo', e.target.checked)}
                  title="Activo"
                  className="w-4 h-4 accent-[var(--color-primary)]"
                />
              </div>
              <div className="col-span-1 flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  disabled={variants.length === 1}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                  title="Eliminar variante"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={saving}>
          {isEdit ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
