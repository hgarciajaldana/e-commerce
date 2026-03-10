import { buildWhatsAppUrl, formatDecimal } from "../../utils/whatsapp";

const BASE_PARAMS = {
  numeroPedido: "ABC12345",
  items: [
    {
      nombreProducto: "Remera Básica",
      nombreVariante: "Azul L",
      cantidad: 2,
      subtotal: "1000.00",
    },
    {
      nombreProducto: "Pantalón Cargo",
      nombreVariante: null,
      cantidad: 1,
      subtotal: "2500.00",
    },
  ],
  total: "3500.00",
  subtotal: "3500.00",
  simbolo: "$",
  clienteNombre: "Juan Pérez",
  clienteTelefono: "+54 9 11 1234-5678",
  notas: null,
  mensajeTemplate: null,
};

// ─────────────────────────────────────────────────────────────
// buildWhatsAppUrl
// ─────────────────────────────────────────────────────────────

describe("buildWhatsAppUrl — formato de URL", () => {
  test("genera URL con esquema https://wa.me/", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(url).toMatch(/^https:\/\/wa\.me\//);
  });

  test("incluye query param text= con contenido codificado", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(url).toContain("?text=");
    // El texto codificado debe poder decodificarse
    const encoded = url.split("?text=")[1];
    expect(() => decodeURIComponent(encoded)).not.toThrow();
  });

  test("limpia el número — elimina espacios, guiones, paréntesis y +", () => {
    const url = buildWhatsAppUrl("+54 9 11 1234-5678", BASE_PARAMS);
    // El número limpio debe aparecer directamente en la URL (sólo dígitos)
    expect(url).toMatch(/wa\.me\/\d+\?text=/);
    expect(url).toContain("wa.me/5491112345678");
  });

  test("número ya limpio se preserva tal cual", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(url).toContain("wa.me/5491112345678");
  });
});

describe("buildWhatsAppUrl — mensaje por defecto", () => {
  function decode(url: string): string {
    return decodeURIComponent(url.split("?text=")[1]);
  }

  test("incluye encabezado de saludo", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(decode(url)).toContain("Hola!");
  });

  test("incluye número de pedido en negrita Markdown", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(decode(url)).toContain("*Pedido #ABC12345*");
  });

  test("incluye ítem con variante en formato correcto", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    const msg = decode(url);
    expect(msg).toContain("• Remera Básica (Azul L) x2 — $1000.00");
  });

  test("incluye ítem sin variante — sin paréntesis", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    const msg = decode(url);
    expect(msg).toContain("• Pantalón Cargo x1 — $2500.00");
    expect(msg).not.toContain("Pantalón Cargo (");
  });

  test("incluye total formateado con símbolo de moneda", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(decode(url)).toContain("*Total: $3500.00*");
  });

  test("incluye nombre del cliente", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(decode(url)).toContain("Juan Pérez");
  });

  test("incluye teléfono del cliente", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    expect(decode(url)).toContain("+54 9 11 1234-5678");
  });

  test("incluye notas cuando se proporcionan", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      notas: "Sin cebolla por favor",
    });
    expect(decode(url)).toContain("📝 Notas: Sin cebolla por favor");
  });

  test("omite línea de notas cuando notas es null", () => {
    const url = buildWhatsAppUrl("5491112345678", { ...BASE_PARAMS, notas: null });
    expect(decode(url)).not.toContain("Notas:");
  });

  test("omite línea de notas cuando notas es undefined", () => {
    const params = { ...BASE_PARAMS };
    delete (params as Record<string, unknown>).notas;
    const url = buildWhatsAppUrl("5491112345678", params as typeof BASE_PARAMS);
    expect(decode(url)).not.toContain("Notas:");
  });

  test("múltiples ítems aparecen en líneas separadas", () => {
    const url = buildWhatsAppUrl("5491112345678", BASE_PARAMS);
    const msg = decode(url);
    expect(msg).toContain("Remera Básica");
    expect(msg).toContain("Pantalón Cargo");
  });
});

describe("buildWhatsAppUrl — template personalizado", () => {
  function decode(url: string): string {
    return decodeURIComponent(url.split("?text=")[1]);
  }

  test("reemplaza {{numeroPedido}}", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Pedido: {{numeroPedido}}",
    });
    expect(decode(url)).toBe("Pedido: ABC12345");
  });

  test("reemplaza {{clienteNombre}}", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Cliente: {{clienteNombre}}",
    });
    expect(decode(url)).toBe("Cliente: Juan Pérez");
  });

  test("reemplaza {{clienteTelefono}}", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Tel: {{clienteTelefono}}",
    });
    expect(decode(url)).toBe("Tel: +54 9 11 1234-5678");
  });

  test("reemplaza {{total}} y {{subtotal}}", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Total: {{total}} / Sub: {{subtotal}}",
    });
    expect(decode(url)).toBe("Total: 3500.00 / Sub: 3500.00");
  });

  test("reemplaza {{simbolo}}", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Moneda: {{simbolo}}",
    });
    expect(decode(url)).toBe("Moneda: $");
  });

  test("reemplaza {{items}} con líneas de productos", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Items:\n{{items}}",
    });
    const msg = decode(url);
    expect(msg).toContain("Remera Básica (Azul L) x2");
    expect(msg).toContain("Pantalón Cargo x1");
  });

  test("reemplaza {{notas}} con cadena vacía si notas es null", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Nota: {{notas}}",
      notas: null,
    });
    expect(decode(url)).toBe("Nota: ");
  });

  test("reemplaza {{notas}} con el valor cuando existe", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "Nota: {{notas}}",
      notas: "Entregar en portería",
    });
    expect(decode(url)).toBe("Nota: Entregar en portería");
  });

  test("reemplaza múltiples ocurrencias del mismo placeholder", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate: "{{numeroPedido}} — confirmado: {{numeroPedido}}",
    });
    expect(decode(url)).toBe("ABC12345 — confirmado: ABC12345");
  });

  test("template completo con todos los placeholders", () => {
    const url = buildWhatsAppUrl("5491112345678", {
      ...BASE_PARAMS,
      mensajeTemplate:
        "Pedido {{numeroPedido}}\n{{items}}\nTotal: {{simbolo}}{{total}}\nCliente: {{clienteNombre}} ({{clienteTelefono}})\nNotas: {{notas}}",
      notas: "Express",
    });
    const msg = decode(url);
    expect(msg).toContain("Pedido ABC12345");
    expect(msg).toContain("Total: $3500.00");
    expect(msg).toContain("Cliente: Juan Pérez");
    expect(msg).toContain("Notas: Express");
  });
});

// ─────────────────────────────────────────────────────────────
// formatDecimal
// ─────────────────────────────────────────────────────────────

describe("formatDecimal", () => {
  test("formatea entero con dos decimales", () => {
    expect(formatDecimal(100)).toBe("100.00");
  });

  test("formatea decimal con una cifra a dos", () => {
    expect(formatDecimal(99.9)).toBe("99.90");
  });

  test("redondea la tercera cifra decimal", () => {
    expect(formatDecimal(3.456)).toBe("3.46");
    expect(formatDecimal(3.454)).toBe("3.45");
  });

  test("acepta string numérico", () => {
    expect(formatDecimal("250.5")).toBe("250.50");
  });

  test("formatea cero", () => {
    expect(formatDecimal(0)).toBe("0.00");
  });

  test("formatea número negativo", () => {
    expect(formatDecimal(-5.5)).toBe("-5.50");
  });

  test("acepta objeto con valueOf numérico (Decimal-like)", () => {
    const decimalLike = { valueOf: () => 1234.5 };
    expect(formatDecimal(decimalLike)).toBe("1234.50");
  });
});
