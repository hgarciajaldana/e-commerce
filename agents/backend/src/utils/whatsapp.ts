interface CheckoutItem {
  nombreProducto: string;
  nombreVariante?: string | null;
  cantidad: number;
  subtotal: string;
}

interface WhatsAppMessageParams {
  numeroPedido: string;
  items: CheckoutItem[];
  total: string;
  subtotal: string;
  simbolo: string;
  clienteNombre: string;
  clienteTelefono: string;
  notas?: string | null;
  mensajeTemplate?: string | null;
}

export function buildWhatsAppUrl(
  whatsappNumero: string,
  params: WhatsAppMessageParams
): string {
  const mensaje = buildMensaje(params);
  const numeroLimpio = whatsappNumero.replace(/\D/g, "");
  return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
}

function buildMensaje(params: WhatsAppMessageParams): string {
  // Si hay template personalizado, usarlo; si no, usar el default
  if (params.mensajeTemplate) {
    return renderTemplate(params.mensajeTemplate, params);
  }

  const itemsTexto = params.items
    .map((item) => {
      const variante = item.nombreVariante ? ` (${item.nombreVariante})` : "";
      return `• ${item.nombreProducto}${variante} x${item.cantidad} — ${params.simbolo}${item.subtotal}`;
    })
    .join("\n");

  const notasLinea = params.notas ? `\nNotas: ${params.notas}` : "";

  return (
    `Hola! Quiero hacer el siguiente pedido:\n` +
    `*Pedido #${params.numeroPedido}*\n` +
    `${itemsTexto}\n` +
    `*Total: ${params.simbolo}${params.total}*\n` +
    `Nombre: ${params.clienteNombre}\n` +
    `Telefono: ${params.clienteTelefono}` +
    notasLinea
  );
}

function renderTemplate(template: string, params: WhatsAppMessageParams): string {
  const itemsTexto = params.items
    .map((item) => {
      const variante = item.nombreVariante ? ` (${item.nombreVariante})` : "";
      return `• ${item.nombreProducto}${variante} x${item.cantidad} — ${params.simbolo}${item.subtotal}`;
    })
    .join("\n");

  return template
    .replace(/\{\{numeroPedido\}\}/g, params.numeroPedido)
    .replace(/\{\{items\}\}/g, itemsTexto)
    .replace(/\{\{total\}\}/g, params.total)
    .replace(/\{\{subtotal\}\}/g, params.subtotal)
    .replace(/\{\{simbolo\}\}/g, params.simbolo)
    .replace(/\{\{clienteNombre\}\}/g, params.clienteNombre)
    .replace(/\{\{clienteTelefono\}\}/g, params.clienteTelefono)
    .replace(/\{\{notas\}\}/g, params.notas ?? "");
}

export function formatDecimal(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return "0";
  return num.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
