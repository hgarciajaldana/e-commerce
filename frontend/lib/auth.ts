/**
 * Auth utilities — JWT storage, decoding, login and logout.
 * Token is stored in localStorage under key 'auth_token'.
 * Signature verification happens server-side on every API call.
 */

import { authApi } from './api'
import { JWTPayload } from '@/types'

const TOKEN_KEY = 'auth_token'

// ─── Storage ───────────────────────────────────────────────

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

// ─── Decode ────────────────────────────────────────────────

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload as JWTPayload
  } catch {
    return null
  }
}

export function getJWTPayload(): JWTPayload | null {
  const token = getToken()
  if (!token) return null
  const payload = decodeToken(token)
  if (!payload) return null
  if (payload.exp * 1000 < Date.now()) {
    removeToken()
    return null
  }
  return payload
}

export function isAuthenticated(): boolean {
  return getJWTPayload() !== null
}

export function isSuperAdmin(): boolean {
  return getJWTPayload()?.rol === 'super_admin'
}

export function isAdminEmpresa(): boolean {
  return getJWTPayload()?.rol === 'admin_empresa'
}

// ─── Actions ───────────────────────────────────────────────

/**
 * Login for empresa admin. Stores token and returns decoded payload.
 * Throws with `status` property on HTTP errors (401, 403, etc.).
 */
export async function login(email: string, password: string): Promise<JWTPayload> {
  const { token } = await authApi.login(email, password)
  setToken(token)
  const payload = decodeToken(token)
  if (!payload) throw new Error('Token inválido recibido del servidor')
  return payload
}

/**
 * Login for super admin. Stores token and returns decoded payload.
 * Throws with `status` property on HTTP errors (401, 403, etc.).
 */
export async function loginSuperAdmin(email: string, password: string): Promise<JWTPayload> {
  const { token } = await authApi.loginSuperAdmin(email, password)
  setToken(token)
  const payload = decodeToken(token)
  if (!payload) throw new Error('Token inválido recibido del servidor')
  return payload
}

/** Clears the stored token. */
export function logout(): void {
  removeToken()
}
