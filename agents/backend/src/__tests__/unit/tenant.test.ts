import { Request, Response, NextFunction } from "express";

// ── Mock de Prisma — debe ir ANTES del import del middleware ──────────────
jest.mock("../../lib/prisma", () => ({
  prisma: {
    empresa: {
      findFirst: jest.fn(),
    },
  },
}));

import { tenantMiddleware } from "../../middleware/tenant.middleware";
import { prisma } from "../../lib/prisma";

// Helper tipado para el mock de empresa.findFirst
const mockFindFirst = prisma.empresa.findFirst as jest.MockedFunction<
  typeof prisma.empresa.findFirst
>;

// ── Factories de objetos de Express ──────────────────────────────────────

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    hostname: "localhost", // 1 segmento → no extrae slug
    ...overrides,
  } as unknown as Request;
}

const DUMMY_RES = {} as Response;

// ── Fixture de empresa activa ─────────────────────────────────────────────

const EMPRESA_ACTIVA = {
  id: "emp-abc123",
  subdominio: "tienda-demo",
  activa: true,
  deleted_at: null,
  configuracion: {
    moneda: "ARS",
    datos_tienda: {
      monedaSimbolo: "$",
      whatsappNumero: "5491112345678",
      mensajeTemplate: null,
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Resolución del slug
// ─────────────────────────────────────────────────────────────

describe("tenantMiddleware — resolución de slug", () => {
  beforeEach(() => jest.clearAllMocks());

  test("llama next(AppError 400) si no hay slug en header ni en hostname", async () => {
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(
      makeReq({ hostname: "localhost" }), // 1 segmento, no hay header
      DUMMY_RES,
      next
    );
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(err).toMatchObject({ statusCode: 400, code: "MISSING_TENANT" });
  });

  test("extrae slug del header x-empresa-slug con prioridad sobre hostname", async () => {
    mockFindFirst.mockResolvedValue(null as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(
      makeReq({
        headers: { "x-empresa-slug": "header-slug" },
        hostname: "hostname-slug.plataforma.com",
      }),
      DUMMY_RES,
      next
    );
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ subdominio: "header-slug" }),
      })
    );
  });

  test("extrae slug del primer segmento del hostname (3+ partes)", async () => {
    mockFindFirst.mockResolvedValue(null as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(
      makeReq({ hostname: "mitienda.plataforma.com" }),
      DUMMY_RES,
      next
    );
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ subdominio: "mitienda" }),
      })
    );
  });

  test("hostname con sólo 2 segmentos no extrae slug → error 400", async () => {
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(
      makeReq({ hostname: "plataforma.com" }),
      DUMMY_RES,
      next
    );
    const err = next.mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(err).toMatchObject({ statusCode: 400, code: "MISSING_TENANT" });
  });
});

// ─────────────────────────────────────────────────────────────
// Lookup de empresa en BD
// ─────────────────────────────────────────────────────────────

describe("tenantMiddleware — lookup de empresa", () => {
  const REQ_CON_SLUG = makeReq({ headers: { "x-empresa-slug": "tienda-demo" } });

  beforeEach(() => jest.clearAllMocks());

  test("llama next(AppError 404) si empresa no existe en BD", async () => {
    mockFindFirst.mockResolvedValue(null as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(REQ_CON_SLUG, DUMMY_RES, next);
    const err = next.mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(err).toMatchObject({ statusCode: 404, code: "TENANT_NOT_FOUND" });
  });

  test("el mensaje del 404 incluye el slug buscado", async () => {
    mockFindFirst.mockResolvedValue(null as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(REQ_CON_SLUG, DUMMY_RES, next);
    const err = next.mock.calls[0][0] as unknown as Error;
    expect(err.message).toContain("tienda-demo");
  });

  test("llama next(AppError 403) si empresa existe pero está inactiva", async () => {
    mockFindFirst.mockResolvedValue({
      ...EMPRESA_ACTIVA,
      activa: false,
    } as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(REQ_CON_SLUG, DUMMY_RES, next);
    const err = next.mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(err).toMatchObject({ statusCode: 403, code: "TENANT_INACTIVE" });
  });

  test("busca empresa con deleted_at: null para excluir eliminadas", async () => {
    mockFindFirst.mockResolvedValue(null as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(REQ_CON_SLUG, DUMMY_RES, next);
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deleted_at: null }),
      })
    );
  });

  test("propaga errores inesperados de Prisma a next(err)", async () => {
    const dbError = new Error("Connection refused");
    mockFindFirst.mockRejectedValue(dbError as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    await tenantMiddleware(REQ_CON_SLUG, DUMMY_RES, next);
    expect(next).toHaveBeenCalledWith(dbError);
  });
});

// ─────────────────────────────────────────────────────────────
// Asignación de req.tenant (happy path)
// ─────────────────────────────────────────────────────────────

describe("tenantMiddleware — asignación de req.tenant", () => {
  beforeEach(() => jest.clearAllMocks());

  test("llama next() sin argumentos en el caso válido", async () => {
    mockFindFirst.mockResolvedValue(EMPRESA_ACTIVA as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const req = makeReq({ headers: { "x-empresa-slug": "tienda-demo" } });
    await tenantMiddleware(req, DUMMY_RES, next);
    expect(next).toHaveBeenCalledWith(); // sin error
  });

  test("asigna empresaId y subdominio correctos", async () => {
    mockFindFirst.mockResolvedValue(EMPRESA_ACTIVA as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const req = makeReq({ headers: { "x-empresa-slug": "tienda-demo" } });
    await tenantMiddleware(req, DUMMY_RES, next);
    expect((req as Request & { tenant: Record<string, unknown> }).tenant).toMatchObject({
      empresaId: "emp-abc123",
      subdominio: "tienda-demo",
    });
  });

  test("asigna moneda, símbolo, whatsappNumero y mensajeTemplate", async () => {
    mockFindFirst.mockResolvedValue(EMPRESA_ACTIVA as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const req = makeReq({ headers: { "x-empresa-slug": "tienda-demo" } });
    await tenantMiddleware(req, DUMMY_RES, next);
    expect((req as Request & { tenant: Record<string, unknown> }).tenant).toMatchObject({
      moneda: "ARS",
      monedaSimbolo: "$",
      whatsappNumero: "5491112345678",
      mensajeTemplate: null,
    });
  });

  test("usa defaults ARS / $ / null cuando configuracion es null", async () => {
    mockFindFirst.mockResolvedValue({
      ...EMPRESA_ACTIVA,
      configuracion: null,
    } as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const req = makeReq({ headers: { "x-empresa-slug": "tienda-demo" } });
    await tenantMiddleware(req, DUMMY_RES, next);
    const tenant = (req as Request & { tenant: Record<string, unknown> }).tenant;
    expect(tenant.moneda).toBe("ARS");
    expect(tenant.monedaSimbolo).toBe("$");
    expect(tenant.whatsappNumero).toBeNull();
    expect(tenant.mensajeTemplate).toBeNull();
  });

  test("usa default $ cuando monedaSimbolo no está en datos_tienda", async () => {
    mockFindFirst.mockResolvedValue({
      ...EMPRESA_ACTIVA,
      configuracion: {
        moneda: "USD",
        datos_tienda: { whatsappNumero: null, mensajeTemplate: null },
      },
    } as never);
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    const req = makeReq({ headers: { "x-empresa-slug": "tienda-demo" } });
    await tenantMiddleware(req, DUMMY_RES, next);
    const tenant = (req as Request & { tenant: Record<string, unknown> }).tenant;
    expect(tenant.monedaSimbolo).toBe("$");
    expect(tenant.moneda).toBe("USD");
  });
});
