'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Categoria, Producto, ProductoFormData } from '@/types'
import ErrorMessage from '@/components/ui/ErrorMessage'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Props {
  initial?: Producto
  onSuccess: (producto: Producto) => void
  onCancel: () => void
}

const emptyForm: ProductoFormData = {
  nombre: '',
  descripcion: '',
  precio: '',
  categoriaId: '',
  destacado: false,
  activo: true,
}

export default function ProductForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<ProductoFormData>(
    initial
      ? {
          nombre: initial.nombre,
          descripcion: initial.descripcion ?? '',
          precio: String(initial.precio),
          categoriaId: initial.categoriaId ?? '',
          destacado: initial.destacado,
          activo: initial.activo,
        }
      : emptyForm
  )
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .getCategories({ limit: 100, activo: true })
      .then((res) => setCategorias(res.data))
      .catch(() => {/* no bloquea el formulario */})
  }, [])

  function set<K extends keyof ProductoFormData>(key: K, value: ProductoFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const precio = parseFloat(form.precio)
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (isNaN(precio) || precio < 0) { setError('El precio debe ser un número válido'); return }

    setSaving(true)
    try {
      let result: Producto
      if (initial) {
        result = await adminApi.updateProduct(initial.id, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion || undefined,
          precio,
          categoriaId: form.categoriaId || undefined,
          destacado: form.destacado,
          activo: form.activo,
          version: initial.version,
        })
      } else {
        result = await adminApi.createProduct({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion || undefined,
          precio,
          categoriaId: form.categoriaId || undefined,
          destacado: form.destacado,
        })
      }
      onSuccess(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}

      <div>
        <label className="label">Nombre *</label>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          className="input"
          placeholder="Nombre del producto"
          required
        />
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          className="input"
          rows={3}
          placeholder="Descripción del producto"
        />
      </div>

      <div>
        <label className="label">Precio *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.precio}
          onChange={(e) => set('precio', e.target.value)}
          className="input"
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label className="label">Categoría</label>
        <select
          value={form.categoriaId}
          onChange={(e) => set('categoriaId', e.target.value)}
          className="input"
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.destacado}
            onChange={(e) => set('destacado', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Destacado</span>
        </label>

        {initial && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => set('activo', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Activo</span>
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
          {initial ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  )
}
