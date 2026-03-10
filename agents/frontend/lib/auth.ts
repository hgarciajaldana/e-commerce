/**
 * Auth helpers — sesión delegada al portal-clientes.operly.tech.
 * El token JWT llega por query param (?token=...) y se almacena en localStorage.
 * No hay login propio: la autenticación la gestiona el portal central.
 */

const TOKEN_KEY = 'admin_token';
const NIT_KEY = 'admin_nit';
const USER_KEY = 'admin_user_id';

export interface SessionParams {
  token: string;
  nit: string;
  userId: string;
}

// ── Inicializar sesión desde query params ─────────────────────────────────────

export function initSession({ token, nit, userId }: SessionParams): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(NIT_KEY, nit);
  localStorage.setItem(USER_KEY, userId);
}

// ── Getters ───────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getNit(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(NIT_KEY);
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_KEY);
}

export function removeSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(NIT_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Validación (solo decodifica exp del JWT, sin verificar firma) ─────────────

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export interface TokenPayload {
  user_id?: string;
  company_id?: string;
  plan_id?: string;
  role?: 'ADMIN' | 'USER';
  exp?: number;
  iat?: number;
  // legacy fields
  sub?: string;
}

export function decodeToken(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as TokenPayload;
  } catch {
    return null;
  }
}

// Compatibilidad con imports existentes
export const setToken = (token: string) => {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
};
export const removeToken = removeSession;

// Extrae query params de autenticación de la URL actual
export function extractAuthParams(): SessionParams | null {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  const token = sp.get('token');
  const nit = sp.get('nit');
  const userId = sp.get('documento') ?? sp.get('user_id') ?? 'unknown';
  if (token && nit) return { token, nit, userId };
  return null;
}

// Limpia los query params de auth de la URL sin recargar la página
export function cleanAuthParams(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  ['token', 'companyId', 'nit', 'tipo_documento', 'documento'].forEach((k) =>
    url.searchParams.delete(k)
  );
  window.history.replaceState({}, '', url.toString());
}
