/**
 * auth-401.test.ts
 * Tests that all protected endpoints return 401 when no Authorization header is provided.
 * No mocks: uses the real middleware, which short-circuits before any network/DB call
 * when the Authorization header is missing.
 */
import request from "supertest";
import app from "../../app";

// Set test env so morgan doesn't log
process.env.NODE_ENV = "test";

describe("Auth — No token → 401", () => {
  // ── SUPERADMIN ────────────────────────────────────────────────────────────
  describe("Superadmin routes", () => {
    it("GET /api/v1/superadmin/empresas → 401", async () => {
      const res = await request(app).get("/api/v1/superadmin/empresas");
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe("UNAUTHORIZED");
    });

    it("POST /api/v1/superadmin/empresas → 401", async () => {
      const res = await request(app).post("/api/v1/superadmin/empresas").send({});
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe("UNAUTHORIZED");
    });

    it("GET /api/v1/superadmin/empresas/:id → 401", async () => {
      const res = await request(app).get("/api/v1/superadmin/empresas/some-id");
      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe("UNAUTHORIZED");
    });

    it("PUT /api/v1/superadmin/empresas/:id → 401 (auth middleware antes que router)", async () => {
      const res = await request(app).put("/api/v1/superadmin/empresas/some-id").send({});
      expect(res.status).toBe(401);
    });

    it("DELETE /api/v1/superadmin/empresas/:id → 401 (auth middleware antes que router)", async () => {
      const res = await request(app).delete("/api/v1/superadmin/empresas/some-id");
      expect(res.status).toBe(401);
    });

    it("PATCH /api/v1/superadmin/empresas/:id/activar → 401", async () => {
      const res = await request(app).patch("/api/v1/superadmin/empresas/some-id/activar");
      expect(res.status).toBe(401);
    });

    it("PATCH /api/v1/superadmin/empresas/:id/desactivar → 401", async () => {
      const res = await request(app).patch("/api/v1/superadmin/empresas/some-id/desactivar");
      expect(res.status).toBe(401);
    });
  });

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  describe("Admin routes — auth required", () => {
    it("GET /api/v1/admin/categories → 401", async () => {
      const res = await request(app).get("/api/v1/admin/categories");
      expect(res.status).toBe(401);
    });

    it("POST /api/v1/admin/categories → 401", async () => {
      const res = await request(app).post("/api/v1/admin/categories").send({});
      expect(res.status).toBe(401);
    });

    it("PUT /api/v1/admin/categories/:id → 401", async () => {
      const res = await request(app).put("/api/v1/admin/categories/some-id").send({});
      expect(res.status).toBe(401);
    });

    it("DELETE /api/v1/admin/categories/:id → 401", async () => {
      const res = await request(app).delete("/api/v1/admin/categories/some-id");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/admin/products → 401", async () => {
      const res = await request(app).get("/api/v1/admin/products");
      expect(res.status).toBe(401);
    });

    it("POST /api/v1/admin/products → 401", async () => {
      const res = await request(app).post("/api/v1/admin/products").send({});
      expect(res.status).toBe(401);
    });

    it("PUT /api/v1/admin/products/:id → 401", async () => {
      const res = await request(app).put("/api/v1/admin/products/some-id").send({});
      expect(res.status).toBe(401);
    });

    it("DELETE /api/v1/admin/products/:id → 401", async () => {
      const res = await request(app).delete("/api/v1/admin/products/some-id");
      expect(res.status).toBe(401);
    });

    // Spec says /orders but actual routes are /pedidos — test both
    it("GET /api/v1/admin/orders → 401 (auth middleware antes que router)", async () => {
      const res = await request(app).get("/api/v1/admin/orders");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/admin/pedidos → 401", async () => {
      const res = await request(app).get("/api/v1/admin/pedidos");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/admin/store-config → 401 (auth middleware antes que router)", async () => {
      const res = await request(app).get("/api/v1/admin/store-config");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/admin/configuracion → 401", async () => {
      const res = await request(app).get("/api/v1/admin/configuracion");
      expect(res.status).toBe(401);
    });
  });

  // ── STORE ─────────────────────────────────────────────────────────────────
  // El tenantMiddleware corre ANTES del router para /api/v1/store.
  // Sin header x-empresa-slug, CUALQUIER ruta bajo /store devuelve 400 MISSING_TENANT.
  describe("Store routes — tenant header required", () => {
    it("GET /api/v1/store/products sin header → 400 (MISSING_TENANT)", async () => {
      const res = await request(app).get("/api/v1/store/products");
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("MISSING_TENANT");
    });

    it("GET /api/v1/store/productos sin header → 400 (MISSING_TENANT)", async () => {
      const res = await request(app).get("/api/v1/store/productos");
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("MISSING_TENANT");
    });

    it("GET /api/v1/store/categories sin header → 400 (MISSING_TENANT)", async () => {
      const res = await request(app).get("/api/v1/store/categories");
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("MISSING_TENANT");
    });

    it("POST /api/v1/store/checkout sin header → 400 (MISSING_TENANT)", async () => {
      const res = await request(app).post("/api/v1/store/checkout").send({});
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("MISSING_TENANT");
    });

    it("POST /api/v1/store/checkout/whatsapp sin header → 400 (MISSING_TENANT)", async () => {
      const res = await request(app).post("/api/v1/store/checkout/whatsapp").send({});
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("MISSING_TENANT");
    });
  });

  // ── HEALTH ────────────────────────────────────────────────────────────────
  describe("Health check (público)", () => {
    it("GET /health → 200", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});
