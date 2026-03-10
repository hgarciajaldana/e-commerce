interface AuditEntry {
  timestamp: string;
  accion: string;
  recurso: string;
  recursoId?: string;
  empresaId?: string;
  usuarioId?: string;
  usuarioRol?: string;
  datos?: unknown;
}

export function auditLog(entry: AuditEntry): void {
  const log: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  // En MVP: escribir a stdout con formato estructurado
  // En producción: reemplazar por servicio de logging dedicado (Winston, Datadog, etc.)
  console.log(JSON.stringify({ level: "audit", ...log }));
}
