import {
  parsePagination,
  buildPaginatedResult,
  getSkip,
} from "../../utils/pagination";

// ─────────────────────────────────────────────────────────────
// parsePagination
// ─────────────────────────────────────────────────────────────

describe("parsePagination", () => {
  describe("valores por defecto", () => {
    test("query vacío devuelve page=1 y limit=20", () => {
      expect(parsePagination({})).toEqual({ page: 1, limit: 20 });
    });

    test("page undefined devuelve page=1", () => {
      expect(parsePagination({ limit: "10" })).toEqual({ page: 1, limit: 10 });
    });

    test("limit undefined devuelve limit=20", () => {
      expect(parsePagination({ page: "3" })).toEqual({ page: 3, limit: 20 });
    });
  });

  describe("valores válidos", () => {
    test("parsea page y limit como strings numéricos", () => {
      expect(parsePagination({ page: "5", limit: "50" })).toEqual({
        page: 5,
        limit: 50,
      });
    });

    test("acepta números directamente (no sólo strings)", () => {
      expect(parsePagination({ page: 2, limit: 10 })).toEqual({
        page: 2,
        limit: 10,
      });
    });

    test("page=1 y limit=1 son valores mínimos válidos", () => {
      expect(parsePagination({ page: "1", limit: "1" })).toEqual({
        page: 1,
        limit: 1,
      });
    });

    test("limit=100 es el máximo aceptado", () => {
      expect(parsePagination({ limit: "100" })).toEqual({ page: 1, limit: 100 });
    });
  });

  describe("clamping de page", () => {
    test("page=0 se normaliza a 1", () => {
      expect(parsePagination({ page: "0" })).toEqual({ page: 1, limit: 20 });
    });

    test("page negativa se normaliza a 1", () => {
      expect(parsePagination({ page: "-10" })).toEqual({ page: 1, limit: 20 });
    });
  });

  describe("clamping de limit", () => {
    test("limit=0 se normaliza a 1", () => {
      expect(parsePagination({ limit: "0" })).toEqual({ page: 1, limit: 1 });
    });

    test("limit negativo se normaliza a 1", () => {
      expect(parsePagination({ limit: "-5" })).toEqual({ page: 1, limit: 1 });
    });

    test("limit=101 se recorta a 100", () => {
      expect(parsePagination({ limit: "101" })).toEqual({ page: 1, limit: 100 });
    });

    test("limit=200 se recorta a 100", () => {
      expect(parsePagination({ limit: "200" })).toEqual({ page: 1, limit: 100 });
    });
  });

  describe("entradas no numéricas", () => {
    test("page='abc' cae al valor por defecto 1", () => {
      expect(parsePagination({ page: "abc" })).toEqual({ page: 1, limit: 20 });
    });

    test("limit='xyz' cae al valor por defecto 20", () => {
      expect(parsePagination({ limit: "xyz" })).toEqual({ page: 1, limit: 20 });
    });

    test("ambos no numéricos caen a sus defaults", () => {
      expect(parsePagination({ page: "nope", limit: "nope" })).toEqual({
        page: 1,
        limit: 20,
      });
    });

    test("string vacío cae al default", () => {
      expect(parsePagination({ page: "", limit: "" })).toEqual({
        page: 1,
        limit: 20,
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────
// buildPaginatedResult
// ─────────────────────────────────────────────────────────────

describe("buildPaginatedResult", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  test("devuelve data, total, page, totalPages y limit", () => {
    const result = buildPaginatedResult(items, 30, { page: 1, limit: 10 });
    expect(result).toEqual({
      data: items,
      total: 30,
      page: 1,
      totalPages: 3,
      limit: 10,
    });
  });

  test("totalPages con división exacta", () => {
    expect(buildPaginatedResult([], 20, { page: 1, limit: 10 }).totalPages).toBe(2);
  });

  test("totalPages con residuo redondea hacia arriba", () => {
    expect(buildPaginatedResult([], 21, { page: 1, limit: 10 }).totalPages).toBe(3);
    expect(buildPaginatedResult([], 1, { page: 1, limit: 10 }).totalPages).toBe(1);
    expect(buildPaginatedResult([], 11, { page: 1, limit: 10 }).totalPages).toBe(2);
  });

  test("totalPages=0 cuando total=0", () => {
    expect(buildPaginatedResult([], 0, { page: 1, limit: 10 }).totalPages).toBe(0);
  });

  test("preserva page y limit en el resultado", () => {
    const result = buildPaginatedResult([], 100, { page: 5, limit: 25 });
    expect(result.page).toBe(5);
    expect(result.limit).toBe(25);
  });

  test("preserva el arreglo data sin mutarlo", () => {
    const original = [{ id: "x" }];
    const result = buildPaginatedResult(original, 1, { page: 1, limit: 10 });
    expect(result.data).toBe(original);
  });

  test("funciona con un único resultado", () => {
    const result = buildPaginatedResult([{ id: "solo" }], 1, { page: 1, limit: 10 });
    expect(result.totalPages).toBe(1);
    expect(result.total).toBe(1);
  });

  test("totalPages con limit=1 es igual al total", () => {
    expect(buildPaginatedResult([], 7, { page: 1, limit: 1 }).totalPages).toBe(7);
  });
});

// ─────────────────────────────────────────────────────────────
// getSkip
// ─────────────────────────────────────────────────────────────

describe("getSkip", () => {
  test("página 1 → skip 0", () => {
    expect(getSkip({ page: 1, limit: 20 })).toBe(0);
  });

  test("página 2 → skip igual al limit", () => {
    expect(getSkip({ page: 2, limit: 20 })).toBe(20);
  });

  test("página 3 con limit 10 → skip 20", () => {
    expect(getSkip({ page: 3, limit: 10 })).toBe(20);
  });

  test("página 5 con limit 25 → skip 100", () => {
    expect(getSkip({ page: 5, limit: 25 })).toBe(100);
  });

  test("página 10 con limit 1 → skip 9", () => {
    expect(getSkip({ page: 10, limit: 1 })).toBe(9);
  });

  test("fórmula (page - 1) * limit en casos extremos", () => {
    expect(getSkip({ page: 100, limit: 100 })).toBe(9900);
  });
});
