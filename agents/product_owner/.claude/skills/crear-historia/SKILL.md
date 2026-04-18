---
name: crear-historia
description: Crea una historia de usuario bien formada con criterios de aceptación claros y la registra en el backlog. Usar para cada funcionalidad del MVP que necesite ser especificada.
argument-hint: "<descripción de la funcionalidad>"
disable-model-invocation: true
allowed-tools: Bash(curl *), Bash(python3 *), Read(*), Write(*), Edit(*)
---

Funcionalidad a especificar: `$ARGUMENTS`

## Paso 1 — Leer backlog actual

Lee `backlog.json` si existe para determinar el próximo ID de historia (US-XX) y evitar duplicados.

## Paso 2 — Identificar el rol de usuario correcto

Antes de escribir la historia, identifica:
- ¿Quién ejecuta esta acción? (usuario final, admin, sistema)
- ¿Hay más de un rol involucrado?
- Si hay múltiples roles → crea una historia por rol

## Paso 3 — Redactar la historia

Usa este formato estrictamente:

```
ID: US-[número]
Título: [nombre corto descriptivo]
Como: [rol específico del usuario]
Quiero: [acción concreta que el usuario realiza]
Para: [beneficio o valor que obtiene]
Criterios de aceptación:
  - [ ] [criterio testable y verificable 1]
  - [ ] [criterio testable y verificable 2]
  - [ ] [criterio testable y verificable 3]
Prioridad: [Alta / Media / Baja]
Estado: Pendiente
Notas técnicas: [restricciones o contexto relevante para el funcional — opcional]
```

**Reglas para criterios de aceptación:**
- Deben ser verificables por QA sin ambigüedad
- Usar "cuando... entonces..." o "dado... cuando... entonces..."
- Mínimo 2, máximo 6 por historia
- No incluir implementación técnica, solo comportamiento esperado

## Paso 4 — Guardar en backlog.json

Agrega la historia al array en `backlog.json`. Si el archivo no existe, créalo:

```json
{
  "historias": [
    {
      "id": "US-01",
      "titulo": "...",
      "como": "...",
      "quiero": "...",
      "para": "...",
      "criterios": ["...", "..."],
      "prioridad": "Alta",
      "estado": "Pendiente",
      "notas_tecnicas": ""
    }
  ]
}
```

## Paso 5 — Registrar como tarea en el state service

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
INTERNAL_KEY="${FABRICA_INTERNAL_KEY:-fabrica-internal-2026}"
SLUG="${FABRICA_SLUG:-proyecto}"

curl -s -X POST "${STATE_URL}/api/projects/${SLUG}/tasks" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY}" \
  -d '{
    "tarea_id": "US-[número]",
    "agente": "product_owner",
    "titulo": "[título de la historia]",
    "estado": "pendiente",
    "detalle": "Historia lista para refinamiento con funcional"
  }'
```

## Paso 6 — Validar antes de entregar

Antes de marcar la historia como lista, ejecuta la skill `validar-historia` sobre ella.
Solo si pasa la validación, actualiza el estado a `Lista` y notifica al gerente.
