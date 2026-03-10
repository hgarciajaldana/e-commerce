# ============================================================================
# Dockerfile — Frontend Ecommerce Multi-Tenant
# Next.js 14 + TypeScript + Tailwind CSS
# Multi-stage build: builder → production
#
# Imagen base: node:20-alpine
# Puerto: 4002
# Versión: 1.0.0
# ============================================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias primero (aprovecha cache de capas)
COPY package.json package-lock.json ./

# Instalar TODAS las dependencias (incluyendo devDeps para build)
RUN npm ci

# Copiar configuración y código fuente
COPY next.config.js tsconfig.json postcss.config.js tailwind.config.ts ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY middleware.ts ./middleware.ts
COPY types ./types

# Variables públicas requeridas en tiempo de build (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_URL=https://api-ecommerce.operly.tech
ARG NEXT_PUBLIC_APP_DOMAIN=ecommerce.operly.tech

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN
ENV NEXT_TELEMETRY_DISABLED=1

# Compilar la app
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar dumb-init para manejo correcto de señales (PID 1)
RUN apk add --no-cache dumb-init

# Copiar node_modules del builder (next está en dependencies, no devDependencies)
COPY --from=builder /app/node_modules ./node_modules

# Copiar artefactos de build y configuración de runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
COPY package.json ./

# Exponer puerto del servidor
EXPOSE 4002

# Usar dumb-init como PID 1 para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]

# Permite override de puerto via PORT env var
CMD ["sh", "-c", "exec node_modules/.bin/next start -p ${PORT:-4002}"]
