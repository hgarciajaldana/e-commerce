'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { storeApi } from '@/lib/api'
import { getCart, getCartTotal, clearCart } from '@/lib/cart'
import { Cart, CheckoutFormData, CheckoutResponse } from '@/types'
import { formatCurrency, generateIdempotencyKey } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

const emptyForm: CheckoutFormData = {
  clienteNombre: '',
  clienteTelefono: '',
  clienteEmail: '',
  notas: '',
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart>({ items: [] })
  const [form, setForm] = useState<CheckoutFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CheckoutResponse | null>(null)

  useEffect(() => {
    setCart(getCart())
    const handler = () => setCart(getCart())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const total = getCartTotal()

  function set<K extends keyof CheckoutFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.clienteNombre.trim()) { setError('El nombre es requerido'); return }
    if (!form.clienteTelefono.trim()) { setError('El teléfono es requerido'); return }
    if (cart.items.length === 0) { setError('El carrito está vacío'); return }

    const idempotencyKey = generateIdempotencyKey()
    setSubmitting(true)
    try {
      const res = await storeApi.checkout({
        clienteNombre: form.clienteNombre.trim(),
        clienteTelefono: form.clienteTelefono.trim(),
        clienteEmail: form.clienteEmail.trim() || undefined,
        notas: form.notas.trim() || undefined,
        items: cart.items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })),
        idempotencyKey,
      })
      clearCart()
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido recibido!</h2>
        <p className="text-gray-500 mb-1">
          Número de pedido: <span className="font-semibold text-gray-900">{result.numeroPedido}</span>
        </p>
        <p className="text-gray-500 mb-6">
          Total: <span className="font-semibold text-blue-600">{formatCurrency(result.total)}</span>
        </p>

        {result.whatsappUrl && (
          <a
            href={result.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-xl transition-colors mb-4"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Confirmar por WhatsApp
          </a>
        )}

        <div className="mt-2">
          <Link href="/" className="btn-secondary">
            Seguir comprando
          </Link>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">El carrito está vacío</p>
        <Link href="/" className="btn-primary">Ir al catálogo</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 mb-4">Tus datos</h2>

            {error && <ErrorMessage message={error} />}

            <div>
              <label className="label">Nombre completo *</label>
              <input
                type="text"
                value={form.clienteNombre}
                onChange={(e) => set('clienteNombre', e.target.value)}
                className="input"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <label className="label">Teléfono *</label>
              <input
                type="tel"
                value={form.clienteTelefono}
                onChange={(e) => set('clienteTelefono', e.target.value)}
                className="input"
                placeholder="+52 55 1234 5678"
                required
              />
            </div>

            <div>
              <label className="label">Email (opcional)</label>
              <input
                type="email"
                value={form.clienteEmail}
                onChange={(e) => set('clienteEmail', e.target.value)}
                className="input"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="label">Notas del pedido (opcional)</label>
              <textarea
                value={form.notas}
                onChange={(e) => set('notas', e.target.value)}
                className="input"
                rows={3}
                placeholder="Instrucciones especiales, dirección de entrega..."
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Procesando...
                </span>
              ) : (
                'Confirmar pedido'
              )}
            </button>
          </form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-20 space-y-3">
            <h2 className="font-semibold text-gray-900">Resumen del pedido</h2>

            <ul className="space-y-2 text-sm">
              {cart.items.map((item) => (
                <li key={item.varianteId} className="flex justify-between text-gray-600">
                  <span className="truncate mr-2">
                    {item.nombreProducto}
                    {item.nombreVariante && ` (${item.nombreVariante})`}
                    {' '}×{item.cantidad}
                  </span>
                  <span className="flex-shrink-0 font-medium text-gray-900">
                    {formatCurrency(item.precio * item.cantidad)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span className="text-blue-600 text-lg">{formatCurrency(total)}</span>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Tu pedido se confirma vía WhatsApp
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
