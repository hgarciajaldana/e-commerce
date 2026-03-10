/**
 * superadmin.test.ts
 * Integration tests for superadmin endpoints with mocked auth and Prisma.
 *
 * Documented discrepancies vs spec:
 *  - PUT /api/v1/superadmin/empresas/:id → 404 (no implementado; solo existen PATCH activate/deactivate)
 *  - DELETE /api/v1/superadmin/empresas/:id → 404 (no implementado)
 */
import request from "supertest";

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

jest.mock("../../middleware/auth.middleware", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.auth = {
      userId: "user-uuid-sa",
      companyId: "company-uuid-sa",
      planId: "plan-pro",
      role: "ADMIN",
    };
    next();
  },
  requireAdminRole: (_req: any, _res: any, next: any) => next(),
  requireSuperAdmin: (_req: any, _res: any, next: any) => next(),
  requireAdminEmpresa: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../middleware/tenant.middleware", () => ({
  tenantMiddleware: (req: any, _res: any, next: any) => {
    req.tenant = {
      empresaId: "empresa-uuid-sa",
      subdominio: "test-sa",
      moneda: "ARS",
      monedaSimbolo: "$",
      whatsappNumero: null,
      mensajeTemplate: null,
    };
    next();
  },
  resolveAdminTenant: (req: any, _res: any, next: any) => {
    req.tenant = {
      empresaId: "empresa-uuid-sa",
      subdominio: "test-sa",
      moneda: "ARS",
      monedaSimbolo: "$",
      whatsappNumero: null,
      mensajeTemplate: null,
    };
    next();
  },
}));

const mockEmpresa = {
  id: "emp-123",
  nombre: "Tienda Test",
  subdominio: "tienda-test",
  portal_company_id: "company-abc",
  plan: "basic",
  activa: true,
  deleted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 1,
  configuracion: { moneda: "ARS", idioma: "es", datos_tienda: {} },
  _count: { admins: 0, productos: 0, pedidos: 0 },
};

jest.mock("../../lib/prisma", () => ({
  prisma: {
    empresa: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    configuracionEmpresa: {
      create: jest.fn().mockResolvedValue({}),
    },
    categoria: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    producto: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    pedido: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    configuracionEmpresaModel: {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import app from "../../app";
import { prisma } from "../../lib/prisma";

const mockPrisma = prisma as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Helper ────────────────────────────────────────────────────────────────────
const SA_TOKEN = "Bearer mock-valid-superadmin-token";

describe("Superadmin — GET /api/v1/superadmin/empresas", () => {
  it("devuelve lista paginada vacía con 200", async () => {
    mockPrisma.empresa.findMany.mockResolvedValue([]);
    mockPrisma.empresa.count.mockResolvedValue(0);

    const res = await request(app)
      .get("/api/v1/superadmin/empresas")
      .set("Authorization", SA_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("devuelve lista con una empresa", async () => {
    mockPrisma.empresa.findMany.mockResolvedValue([mockEmpresa]);
    mockPrisma.empresa.count.mockResolvedValue(1);

    const res = await request(app)
      .get("/api/v1/superadmin/empresas")
      .set("Authorization", SA_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });
});

describe("Superadmin — POST /api/v1/superadmin/empresas", () => {
  it("crea empresa con datos válidos → 201", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(null); // no conflict
    mockPrisma.empresa.create.mockResolvedValue({ ...mockEmpresa, id: "new-emp-1" });
    mockPrisma.configuracionEmpresa.create.mockResolvedValue({});
    mockPrisma.empresa.findUnique.mockResolvedValue({ ...mockEmpresa, id: "new-emp-1" });

    const res = await request(app)
      .post("/api/v1/superadmin/empresas")
      .set("Authorization", SA_TOKEN)
      .send({ nombre: "Tienda Test", subdominio: "tienda-test", plan: "basic" });

    expect(res.status).toBe(201);
  });

  it("rechaza body sin nombre → 400", async () => {
    const res = await request(app)
      .post("/api/v1/superadmin/empresas")
      .set("Authorization", SA_TOKEN)
      .send({ subdominio: "tienda-test" });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza body sin subdominio → 400", async () => {
    const res = await request(app)
      .post("/api/v1/superadmin/empresas")
      .set("Authorization", SA_TOKEN)
      .send({ nombre: "Tienda Test" });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza subdominio duplicado → 409", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(mockEmpresa); // conflict

    const res = await request(app)
      .post("/api/v1/superadmin/empresas")
      .set("Authorization", SA_TOKEN)
      .send({ nombre: "Otra Tienda", subdominio: "tienda-test" });

    expect(res.status).toBe(409);
    expect(res.body.error?.code).toBe("CONFLICT");
  });
});

describe("Superadmin — GET /api/v1/superadmin/empresas/:id", () => {
  it("devuelve empresa existente → 200", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(mockEmpresa);

    const res = await request(app)
      .get("/api/v1/superadmin/empresas/emp-123")
      .set("Authorization", SA_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("emp-123");
  });

  it("empresa no encontrada → 404", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/v1/superadmin/empresas/no-existe")
      .set("Authorization", SA_TOKEN);

    expect(res.status).toBe(404);
    expect(res.body.error?.code).toBe("NOT_FOUND");
  });
});

describe("Superadmin — PATCH activate/deactivate", () => {
  it("PATCH /empresas/:id/activar → 200", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(mockEmpresa);
    mockPrisma.empresa.update.mockResolvedValue({ ...mockEmpresa, activa: true });

    const res = await request(app)
      .patch("/api/v1/superadmin/empresas/emp-123/activar")
      .set("Authorization", SA_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.activa).toBe(true);
  });

  it("PATCH /empresas/:id/desactivar → 200", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(mockEmpresa);
    mockPrisma.empresa.update.mockResolvedValue({ ...mockEmpresa, activa: false });

    const res = await request(app)
      .patch("/api/v1/superadmin/empresas/emp-123/desactivar")
      .set("Authorization", SA_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.activa).toBe(false);
  });

  it("PATCH activar empresa no encontrada → 404", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/v1/superadmin/empresas/no-existe/activar")
      .set("Authorization", SA_TOKEN);

    expect(res.status).toBe(404);
  });
});

// ── Rutas NO implementadas (discrepancia con spec) ────────────────────────────
describe("Superadmin — Rutas NO implementadas (discrepancia vs spec)", () => {
  it("PUT /api/v1/superadmin/empresas/:id → 404 (RUTA FALTANTE)", async () => {
    const res = await request(app)
      .put("/api/v1/superadmin/empresas/emp-123")
      .set("Authorization", SA_TOKEN)
      .send({ nombre: "Nuevo Nombre" });

    // La spec indica que debe existir esta ruta, pero no está implementada
    expect(res.status).toBe(404);
  });

  it("DELETE /api/v1/superadmin/empresas/:id → 404 (RUTA FALTANTE)", async () => {
    const res = await request(app)
      .delete("/api/v1/superadmin/empresas/emp-123")
      .set("Authorization", SA_TOKEN);

    // La spec indica que debe existir esta ruta, pero no está implementada
    expect(res.status).toBe(404);
  });
});
