import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import { tenantMiddleware, resolveAdminTenant } from "./middleware/tenant.middleware";
import { requireAuth, requireAdminRole } from "./middleware/auth.middleware";
import { storeLimiter, adminLimiter } from "./middleware/rateLimit.middleware";
import { errorMiddleware } from "./middleware/error.middleware";

import storeRoutes from "./routes/store";
import adminRoutes from "./routes/admin";
import superadminRoutes from "./routes/superadmin";

const app = express();

// ── Seguridad ──────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Exact match in allowedOrigins list
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any subdomain of operly.tech (covers *-ecommerce.operly.tech, etc.)
      if (/^https?:\/\/([a-z0-9-]+\.)*operly\.tech(:\d+)?$/.test(origin)) return callback(null, true);
      // Allow localhost for development
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Logging ───────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Archivos estáticos (uploads) ──────────────────────────────────────────
const uploadsDir = process.env.UPLOADS_DIR ?? "./uploads";
app.use(
  "/uploads",
  express.static(path.resolve(uploadsDir), {
    maxAge: "7d",
    etag: true,
  })
);

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Rutas públicas de tienda (requieren tenant por subdominio/header) ──────
app.use("/api/v1/store", storeLimiter, tenantMiddleware, storeRoutes);

// ── Rutas de administración de empresa ────────────────────────────────────
// Auth delegada al portal-clientes. Tenant resuelto por portal_company_id del token.
app.use(
  "/api/v1/admin",
  adminLimiter,
  requireAuth,
  resolveAdminTenant,
  requireAdminRole,
  adminRoutes
);

// ── Rutas de super administrador ──────────────────────────────────────────
// Protección de origen (portal-clientes.operly.tech) gestionada en el frontend.
app.use("/api/v1/superadmin", adminLimiter, requireAuth, requireAdminRole, superadminRoutes);

// ── Handler de errores (debe ser el último middleware) ────────────────────
app.use(errorMiddleware);

export default app;
