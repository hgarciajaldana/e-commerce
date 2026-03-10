/**
 * Cart state — localStorage-based, per empresa (key includes empresa slug).
 * Exposes getCart, addItem, updateQuantity, removeItem, clearCart.
 */

import type { CartItem, Cart } from '@/types';

function getCartKey(): string {
  if (typeof window === 'undefined') return 'cart_default';
  const slug =
    document.cookie
      .split('; ')
      .find((r) => r.startsWith('x-empresa-slug='))
      ?.split('=')[1] ?? 'default';
  return `cart_${slug}`;
}

export function getCart(): Cart {
  if (typeof window === 'undefined') return { items: [] };
  try {
    const raw = localStorage.getItem(getCartKey());
    if (!raw) return { items: [] };
    return JSON.parse(raw) as Cart;
  } catch {
    return { items: [] };
  }
}

function saveCart(cart: Cart): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
}

export function addItem(item: CartItem): Cart {
  const cart = getCart();
  const existing = cart.items.findIndex((i) => i.varianteId === item.varianteId);
  if (existing >= 0) {
    cart.items[existing] = {
      ...cart.items[existing],
      cantidad: cart.items[existing].cantidad + item.cantidad,
    };
  } else {
    cart.items.push({ ...item });
  }
  saveCart(cart);
  return cart;
}

export function updateQuantity(varianteId: string, cantidad: number): Cart {
  const cart = getCart();
  const idx = cart.items.findIndex((i) => i.varianteId === varianteId);
  if (idx < 0) return cart;
  if (cantidad <= 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx] = { ...cart.items[idx], cantidad };
  }
  saveCart(cart);
  return cart;
}

export function removeItem(varianteId: string): Cart {
  const cart = getCart();
  cart.items = cart.items.filter((i) => i.varianteId !== varianteId);
  saveCart(cart);
  return cart;
}

export function clearCart(): Cart {
  const empty: Cart = { items: [] };
  saveCart(empty);
  return empty;
}

export function getCartTotal(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
}

export function getCartCount(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.cantidad, 0);
}
