/**
 * Next.js middleware — Multi-tenant resolution by subdomain.
 * Reads Host header, extracts subdomain (empresa-slug.plataforma.com),
 * sets x-empresa-slug cookie so API client can forward it.
 * Admin routes check for valid JWT in localStorage (client-side guard).
 */

import { NextRequest, NextResponse } from 'next/server';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';

const ECOMMERCE_SUFFIX = '-ecommerce.operly.tech';

function extractSlug(host: string): string | null {
  // localhost or exact app domain → no subdomain
  if (host === APP_DOMAIN || !host.includes('.')) return null;

  // Patrón producción con wildcard SSL: {slug}-ecommerce.operly.tech
  const hostWithoutPort = host.split(':')[0];
  if (hostWithoutPort.endsWith(ECOMMERCE_SUFFIX)) {
    return hostWithoutPort.slice(0, -ECOMMERCE_SUFFIX.length) || null;
  }

  // Patrón subdominio directo: {slug}.ecommerce.operly.tech (futuro con ACM)
  const parts = hostWithoutPort.split('.');
  if (parts.length >= 4 && parts.slice(1).join('.') === 'ecommerce.operly.tech') {
    return parts[0] === 'www' ? null : parts[0];
  }

  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname, searchParams } = request.nextUrl;

  // Determine empresa slug from subdomain or query param (dev)
  let slug = extractSlug(host);
  if (!slug) {
    slug = searchParams.get('slug') ?? request.cookies.get('x-empresa-slug')?.value ?? null;
  }

  if (slug) {
    // Forward slug as request header for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-empresa-slug', slug);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    // Set cookie on the SAME response so it reaches the browser
    response.cookies.set('x-empresa-slug', slug, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // readable by JS for API client
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|placeholder-product.svg).*)',
  ],
};
