/**
 * Shared utility functions.
 */

import { v4 as uuidv4 } from 'uuid'

export function formatCurrency(amount: number, simbolo: string = '$'): string {
  return `${simbolo}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

export function generateIdempotencyKey(): string {
  // UUID v4 without external dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getFirstImage(imagenes: { url: string; esPrincipal: boolean }[] | undefined): string | null {
  if (!imagenes || imagenes.length === 0) return null
  const principal = imagenes.find((i) => i.esPrincipal)
  return principal?.url ?? imagenes[0]?.url ?? null
}

export function estadoPedidoLabel(estado: string): string {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    en_proceso: 'En proceso',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  }
  return labels[estado] ?? estado
}

export function estadoPedidoColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    confirmado: 'bg-blue-100 text-blue-800',
    en_proceso: 'bg-purple-100 text-purple-800',
    enviado: 'bg-indigo-100 text-indigo-800',
    entregado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
  }
  return colors[estado] ?? 'bg-gray-100 text-gray-800'
}

export function buildImageUrl(path: string): string {
  if (!path) return '/placeholder-product.svg'
  if (path.startsWith('http')) return path
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  return `${base}/${path.replace(/^\//, '')}`
}
