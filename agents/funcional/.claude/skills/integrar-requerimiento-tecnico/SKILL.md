---
name: integrar-requerimiento-tecnico
description: Integra un requerimiento técnico no funcional del Arquitecto a las historias de usuario afectadas. Usar cuando el Arquitecto envía restricciones de seguridad, rendimiento, auditoría u otros requerimientos técnicos.
argument-hint: "<descripción del requerimiento técnico>"
disable-model-invocation: true
allowed-tools: Read(*), Write(*), Edit(*), Bash(curl *), Bash(python3 *)
---

Requerimiento técnico recibido: `$ARGUMENTS`

## Paso 1 — Clasificar el requerimiento

Identifica el tipo de requerimiento no funcional:

| Tipo | Ejemplos |
|---|---|
| **Seguridad** | JWT obligatorio, validación de permisos, sanitización de inputs |
| **Auditoría** | Log de toda escritura, trazabilidad de cambios, registro de accesos |
| **Rendimiento** | Tiempo máximo de respuesta, paginación obligatoria, caché |
| **Disponibilidad** | Manejo de timeouts, degradación elegante, reintentos |
| **Consistencia** | Transacciones atómicas, idempotencia, validación de unicidad |

## Paso 2 — Identificar historias afectadas

Lee `user_stories.json` y determina qué historias se ven impactadas por `$ARGUMENTS`.

Criterios para considerar una historia afectada:
- Realiza operaciones de escritura (si el requerimiento es de auditoría)
- Accede a datos sensibles (si es de seguridad)
- Es llamada frecuentemente (si es de rendimiento)
- Interactúa con servicios externos (si es de disponibilidad)

## Paso 3 — Evaluar impacto en alcance

Para cada historia afectada, responde:
- ¿El requerimiento agrega trabajo significativo no contemplado originalmente?
- ¿Cambia el comportamiento visible para el usuario?
- ¿Requiere nuevas entidades o campos en el modelo de datos?

**Si el impacto es significativo → escala al PO** antes de integrar, para que evalúe si el alcance cambia.
**Si es un requerimiento técnico transparente** (el usuario no lo ve) → integra directamente.

## Paso 4 — Agregar criterios técnicos a cada historia afectada

Para cada historia, agrega en la sección `criterios_tecnicos` de `user_stories.json`:

```
- [ ] [Descripción clara del criterio técnico derivado de: $ARGUMENTS]
```

Ejemplos según tipo:
- Auditoría: `- [ ] Toda operación de escritura registra: usuario, timestamp, acción, entidad afectada`
- Seguridad: `- [ ] El endpoint valida JWT antes de procesar la solicitud`
- Rendimiento: `- [ ] La respuesta se entrega en menos de 500ms para conjuntos de hasta 1000 registros`

## Paso 5 — Guardar en non_functional_requirements.json

```json
{
  "id": "NFR-[número]",
  "tipo": "seguridad | auditoria | rendimiento | disponibilidad | consistencia",
  "descripcion": "$ARGUMENTS",
  "origen": "arquitecto",
  "historias_afectadas": ["US-01", "US-02"],
  "criterios_generados": ["criterio 1", "criterio 2"]
}
```

## Paso 6 — Reportar al state service

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
INTERNAL_KEY="${FABRICA_INTERNAL_KEY:-fabrica-internal-2026}"
SLUG="${FABRICA_SLUG:-proyecto}"

curl -s -X POST "${STATE_URL}/api/projects/${SLUG}/decisions" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY}" \
  -d "{
    \"agente\": \"funcional\",
    \"tipo\": \"decision\",
    \"contenido\": \"Requerimiento técnico integrado: $ARGUMENTS — afecta historias: [lista]\",
    \"origen\": \"agente\"
  }"
```
