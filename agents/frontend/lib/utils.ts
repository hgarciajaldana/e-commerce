import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem, StoreConfig } from '@/types';

// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price with currency symbol (default: Colombian Pesos es-CO)
export function formatPrice(amount: number | string | undefined | null, simbolo = '$'): string {
  const num = Number(amount ?? 0);
  if (isNaN(num)) return `${simbolo}0`;
  return `${simbolo}${num.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// Generate UUID v4 for idempotency keys
export function generateIdempotencyKey(): string {
  return uuidv4();
}

// Build WhatsApp message from order data
export function buildWhatsAppMessage(params: {
  numeroPedido: string;
  items: CartItem[];
  total: number;
  clienteNombre: string;
  clienteTelefono: string;
  notas?: string;
  simbolo: string;
  template?: string;
}): string {
  const { numeroPedido, items, total, clienteNombre, clienteTelefono, notas, simbolo } = params;

  const itemLines = items
    .map((item) => {
      const subtotal = item.precio * item.cantidad;
      const variantePart = item.nombreVariante ? ` (${item.nombreVariante})` : '';
      return `• ${item.nombreProducto}${variantePart} x${item.cantidad} — ${simbolo}${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    })
    .join('\n');

  const notasPart = notas ? `\nNotas: ${notas}` : '';

  return (
    `Hola! Quiero hacer el siguiente pedido:\n` +
    `*Pedido #${numeroPedido}*\n` +
    `${itemLines}\n` +
    `*Total: ${simbolo}${total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}*\n` +
    `Nombre: ${clienteNombre}\n` +
    `Telefono: ${clienteTelefono}` +
    `${notasPart}`
  );
}

// Build WhatsApp URL
export function buildWhatsAppUrl(numero: string, mensaje: string): string {
  const clean = numero.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(mensaje)}`;
}

// Get image URL (handles relative uploads paths, blob URLs, and external URLs)
export function getImageUrl(path?: string): string {
  if (!path) return '/placeholder-product.svg';
  // blob: URLs (admin preview before upload) and external http(s) URLs — use as-is
  if (path.startsWith('blob:') || path.startsWith('http')) return path;
  // Relative paths like /uploads/... are proxied through Next.js (see next.config.js rewrites)
  return path;
}

// Apply store theme color
export function applyThemeColor(color: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-primary-dark', darkenColor(color, 15));
  }
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(2.55 * percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

// Order status labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  procesando: 'En proceso',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  procesando: 'bg-purple-100 text-purple-800',
  enviado: 'bg-indigo-100 text-indigo-800',
  entregado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};
