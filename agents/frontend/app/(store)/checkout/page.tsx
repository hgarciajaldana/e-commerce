'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { storeApi } from '@/lib/api';
import { getCart, getCartTotal, clearCart } from '@/lib/cart';
import { buildWhatsAppMessage, buildWhatsAppUrl, formatPrice, getImageUrl } from '@/lib/utils';
import type { Cart, CheckoutForm } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import PhoneInput from '@/components/store/PhoneInput';

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappNumero, setWhatsappNumero] = useState<string | null>(null);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CheckoutForm>({
    clienteNombre: '',
    clienteTelefono: '',
    clienteEmail: '',
    notas: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<CheckoutForm>>({});
  const [direccion, setDireccion] = useState('');
  const [direccionError, setDireccionError] = useState<string | undefined>();

  useEffect(() => {
    const c = getCart();
    setCart(c);
    setLoaded(true);
    if (c.items.length === 0) {
      router.replace('/carrito');
    }
    storeApi.getConfig().then((res) => {
      if (res.data?.whatsappNumero) setWhatsappNumero(res.data.whatsappNumero);
    }).catch(() => {});
  }, [router]);

  const validate = (): boolean => {
    const errs: Partial<CheckoutForm> = {};
    const nombre = form.clienteNombre.trim();
    if (!nombre || nombre.length < 3) {
      errs.clienteNombre = 'Solo letras y espacios, mínimo 3 caracteres';
    }
    const digits = form.clienteTelefono.replace(/\D/g, '');
    if (!form.clienteTelefono || digits.length < 7) {
      errs.clienteTelefono = 'Solo números, entre 7 y 15 dígitos';
    }
    if (!form.clienteEmail.trim()) {
      errs.clienteEmail = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clienteEmail.trim())) {
      errs.clienteEmail = 'Email inválido';
    }
    if ((form.notas?.length ?? 0) > 300) {
      errs.notas = 'Las notas no pueden superar 300 caracteres';
    }
    setFormErrors(errs);

    const dir = direccion.trim();
    let dirErr: string | undefined;
    if (!dir) {
      dirErr = 'La dirección de entrega es requerida';
    } else if (dir.length < 10) {
      dirErr = 'La dirección debe tener al menos 10 caracteres';
    }
    setDireccionError(dirErr);

    return Object.keys(errs).length === 0 && !dirErr;
  };

  const handleBlur = (field: keyof CheckoutForm) => {
    const errs: Partial<CheckoutForm> = {};
    if (field === 'clienteNombre') {
      const nombre = form.clienteNombre.trim();
      if (!nombre || nombre.length < 3) errs.clienteNombre = 'Solo letras y espacios, mínimo 3 caracteres';
    }
    if (field === 'clienteEmail') {
      if (!form.clienteEmail.trim()) errs.clienteEmail = 'El email es requerido';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clienteEmail.trim())) errs.clienteEmail = 'Email inválido';
    }
    setFormErrors((e) => ({ ...e, ...errs }));
  };

  const handleLookup = async (params: { email?: string; telefono?: string }) => {
    try {
      const res = await storeApi.lookupCliente(params);
      if (res.data) {
        setForm((f) => ({
          ...f,
          clienteNombre: res.data.nombre || f.clienteNombre,
          clienteEmail: res.data.email || f.clienteEmail,
          clienteTelefono: res.data.telefono
            ? res.data.telefono.replace(/\D/g, '').slice(0, 15)
            : f.clienteTelefono,
        }));
        setLookupMessage('Datos cargados de tu última compra ✓');
      }
    } catch {
      // Ignore silently
    }
  };

  const handleEmailBlur = () => {
    handleBlur('clienteEmail');
    const email = form.clienteEmail.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      handleLookup({ email });
    }
  };

  const handleTelefonoBlur = () => {
    const digits = form.clienteTelefono;
    if (digits.length < 7) {
      setFormErrors((e) => ({ ...e, clienteTelefono: 'Solo números, entre 7 y 15 dígitos' }));
    }
    if (!form.clienteEmail.trim() && digits.length >= 7) {
      handleLookup({ telefono: digits });
    }
  };

  const handleDireccionBlur = () => {
    const dir = direccion.trim();
    if (!dir) setDireccionError('La dirección de entrega es requerida');
    else if (dir.length < 10) setDireccionError('La dirección debe tener al menos 10 caracteres');
    else setDireccionError(undefined);
  };

  const isFormValid = (): boolean => {
    const nombre = form.clienteNombre.trim();
    const digits = form.clienteTelefono.replace(/\D/g, '');
    const dir = direccion.trim();
    const email = form.clienteEmail.trim();
    return (
      nombre.length >= 3 &&
      digits.length >= 7 &&
      digits.length <= 15 &&
      dir.length >= 10 &&
      email.length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      (form.notas?.length ?? 0) <= 300 &&
      cart.items.length > 0
    );
  };

  const handleChange = (field: keyof CheckoutForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'clienteEmail') setLookupMessage(null);
    if (formErrors[field]) {
      setFormErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const handleNombre = (val: string) => {
    const clean = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑ\s]/g, '').slice(0, 80);
    setForm((f) => ({ ...f, clienteNombre: clean }));
    if (formErrors.clienteNombre) {
      setFormErrors((e) => ({ ...e, clienteNombre: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await storeApi.checkout({
        clienteNombre: form.clienteNombre.trim(),
        clienteTelefono: form.clienteTelefono,
        clienteEmail: form.clienteEmail.trim(),
        notas: form.notas?.trim() || undefined,
        items: cart.items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })),
      });
      clearCart();
      window.dispatchEvent(new Event('cart-updated'));
      window.location.href = res.whatsappUrl;
    } catch (err: unknown) {
      if (whatsappNumero) {
        const msg = buildWhatsAppMessage({
          numeroPedido: Date.now().toString().slice(-6),
          items: cart.items,
          total: getCartTotal(cart),
          clienteNombre: form.clienteNombre.trim(),
          clienteTelefono: form.clienteTelefono,
          notas: form.notas?.trim(),
          simbolo: '$',
        });
        const url = buildWhatsAppUrl(whatsappNumero, msg);
        clearCart();
        window.dispatchEvent(new Event('cart-updated'));
        window.location.href = url;
      } else {
        const errMsg = err instanceof Error ? err.message : undefined;
        setError(errMsg || 'Error al procesar el pedido. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const total = getCartTotal(cart);

  if (!loaded) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/carrito"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver al carrito
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-5">Tus datos</h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* 1. Email — triggers lookup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="juan@correo.com"
                value={form.clienteEmail}
                onChange={(e) => handleChange('clienteEmail', e.target.value)}
                onBlur={handleEmailBlur}
                className={formErrors.clienteEmail ? 'border-red-400' : ''}
              />
              {formErrors.clienteEmail && (
                <p className="text-xs text-red-500 mt-1">{formErrors.clienteEmail}</p>
              )}
            </div>

            {/* Lookup success message */}
            {lookupMessage && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle2 size={14} />
                {lookupMessage}
              </div>
            )}

            {/* 2. Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Juan García"
                value={form.clienteNombre}
                onChange={(e) => handleNombre(e.target.value)}
                onBlur={() => handleBlur('clienteNombre')}
                className={formErrors.clienteNombre ? 'border-red-400 focus:ring-red-400' : ''}
              />
              {formErrors.clienteNombre && (
                <p className="text-xs text-red-500 mt-1">{formErrors.clienteNombre}</p>
              )}
            </div>

            {/* 3. Teléfono — triggers lookup if email is empty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono / WhatsApp <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                value={form.clienteTelefono}
                onChange={(v) => handleChange('clienteTelefono', v)}
                onBlur={handleTelefonoBlur}
                error={formErrors.clienteTelefono}
              />
            </div>

            {/* 4. Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección de entrega <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Calle 123 #45-67, Barrio Centro"
                value={direccion}
                onChange={(e) => {
                  setDireccion(e.target.value);
                  if (direccionError) setDireccionError(undefined);
                }}
                onBlur={handleDireccionBlur}
                className={direccionError ? 'border-red-400' : ''}
              />
              {direccionError && (
                <p className="text-xs text-red-500 mt-1">{direccionError}</p>
              )}
            </div>

            {/* 5. Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas del pedido <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Indicaciones especiales para el pedido"
                value={form.notas}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= 300) handleChange('notas', val);
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${formErrors.notas ? 'border-red-400' : 'border-gray-300'}`}
              />
              <div className="flex justify-between mt-1">
                {formErrors.notas
                  ? <p className="text-xs text-red-500">{formErrors.notas}</p>
                  : <span />
                }
                <span className={`text-xs ${(form.notas?.length ?? 0) >= 280 ? 'text-orange-500' : 'text-gray-400'}`}>
                  {form.notas?.length ?? 0}/300
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!isFormValid()}
              className="w-full mt-2"
            >
              <MessageCircle size={18} />
              Enviar pedido por WhatsApp
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Al confirmar serás redirigido a WhatsApp para completar tu pedido.
            </p>
          </form>
        </div>

        {/* Order summary */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-5">Resumen del pedido</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-3">
            {cart.items.map((item) => (
              <div key={item.varianteId} className="flex gap-3 items-start">
                <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-200">
                  <img
                    src={getImageUrl(item.imagenUrl)}
                    alt={item.nombreProducto}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.nombreProducto}</p>
                  {item.nombreVariante && (
                    <p className="text-xs text-gray-500">{item.nombreVariante}</p>
                  )}
                  <p className="text-xs text-gray-500">×{item.cantidad}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatPrice(item.precio * item.cantidad)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
