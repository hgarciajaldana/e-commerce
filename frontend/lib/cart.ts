/**
 * Cart store — localStorage persistence per empresa slug.
 * Uses a simple event-based approach so React components can subscribe.
 * Key: cart_<empresa-slug>
 */

import { Cart, CartItem } from '@/types'

const CART_PREFIX = 'cart_'

function getCartKey(): string {
  if (typeof document === 'undefined') return `${CART_PREFIX}default`
  const match = document.cookie.match(/(?:^|; )x-empresa-slug=([^;]*)/)
  const slug = match ? decodeURIComponent(match[1]) : 'default'
  return `${CART_PREFIX}${slug}`
}

export function getCart(): Cart {
  if (typeof window === 'undefined') return { items: [] }
  try {
    const raw = localStorage.getItem(getCartKey())
    if (!raw) return { items: [] }
    return JSON.parse(raw) as Cart
  } catch {
    return { items: [] }
  }
}

function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getCartKey(), JSON.stringify(cart))
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }))
}

export function addToCart(item: CartItem): void {
  const cart = getCart()
  const existing = cart.items.find((i) => i.varianteId === item.varianteId)
  if (existing) {
    existing.cantidad += item.cantidad
  } else {
    cart.items.push(item)
  }
  saveCart(cart)
}

export function removeFromCart(varianteId: string): void {
  const cart = getCart()
  cart.items = cart.items.filter((i) => i.varianteId !== varianteId)
  saveCart(cart)
}

export function updateQuantity(varianteId: string, cantidad: number): void {
  if (cantidad <= 0) {
    removeFromCart(varianteId)
    return
  }
  const cart = getCart()
  const item = cart.items.find((i) => i.varianteId === varianteId)
  if (item) {
    item.cantidad = cantidad
    saveCart(cart)
  }
}

export function clearCart(): void {
  saveCart({ items: [] })
}

export function getCartTotal(): number {
  return getCart().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
}

export function getCartItemCount(): number {
  return getCart().items.reduce((sum, i) => sum + i.cantidad, 0)
}
