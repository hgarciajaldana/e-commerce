/**
 * Next.js Middleware — Multi-tenant subdomain resolution.
 *
 * Reads the Host header on every request, extracts the empresa slug,
 * and sets two things:
 *   1. request header `x-empresa-slug` → forwarded to backend API calls
 *   2. response cookie `x-empresa-slug` → readable by client-side API calls
 *
 * Subdomain patterns:
 *   - acme.mitienda.com        → slug = "acme"
 *   - acme.localhost:3000      → slug = "acme"  (dev)
 *   - admin.localhost:3000     → slug = "__admin__" (super admin, no tenant)
 *   - localhost:3000           → slug = "__root__"  (no tenant)
 *   - superadmin.mitienda.com → slug = "__superadmin__"
 */

import { NextRequest, NextResponse } from 'next/server'

const BASE_DOMAINS = [
  process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost',
  'mitienda.com',
  'vercel.app',
]

function extractSlug(host: string): string {
  // Strip port
  const hostname = host.split(':')[0]

  // Check if it's a known base domain (no subdomain)
  const isBaseDomain = BASE_DOMAINS.some((base) => hostname === base)
  if (isBaseDomain) return '__root__'

  // Extract subdomain
  for (const base of BASE_DOMAINS) {
    if (hostname.endsWith(`.${base}`)) {
      const sub = hostname.slice(0, hostname.length - base.length - 1)
      // Reject nested subdomains (e.g. a.b.mitienda.com)
      if (!sub.includes('.')) return sub
    }
  }

  // Dev: localhost without subdomain
  if (hostname === 'localhost') return '__root__'

  // Fallback: use hostname as-is (useful for IP addresses or custom domains)
  return hostname
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost'
  const slug = extractSlug(host)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-empresa-slug', slug)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Also set as cookie so client-side fetch calls can read it
  response.cookies.set('x-empresa-slug', slug, {
    httpOnly: false, // needs to be readable by JS (lib/api.ts)
    sameSite: 'lax',
    path: '/',
    // Don't set secure here — let production deployment handle it
  })

  return response
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
