---
name: priorizar-backlog
description: Prioriza y reordena el backlog completo usando criterios de valor vs complejidad. Usar cuando hay múltiples historias acumuladas o cuando el gerente solicita definir el orden de implementación.
disable-model-invocation: true
allowed-tools: Bash(curl *), Bash(python3 *), Read(*), Write(*), Edit(*)
---

## Paso 1 — Leer estado actual

Lee `backlog.json` y `mvp.json` para tener el contexto completo.

También consulta las tareas del state service para ver qué está en progreso:

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
INTERNAL_KEY="${FABRICA_INTERNAL_KEY:-fabrica-internal-2026}"
SLUG="${FABRICA_SLUG:-proyecto}"

curl -s "${STATE_URL}/api/projects/${SLUG}/tasks" \
  -H "X-Internal-Key: ${INTERNAL_KEY}" | python3 -c "
import json, sys
tasks = json.load(sys.stdin).get('data', [])
for t in tasks:
    print(f\"{t.get('tarea_id')}: [{t.get('estado')}] {t.get('titulo','')}\")
"
```

## Paso 2 — Clasificar cada historia

Para cada historia en estado `Pendiente` o `En refinamiento`, asigna:

| Criterio | Escala |
|---|---|
| **Valor para el usuario** | Alto / Medio / Bajo |
| **Riesgo si no se hace primero** | Alto / Medio / Bajo |
| **Dependencias de otras historias** | Bloqueante / Dependiente / Independiente |
| **Complejidad estimada** | Simple / Moderada / Compleja |

## Paso 3 — Aplicar orden de prioridad

Ordena siguiendo estas reglas en cascada:

1. **Primero:** historias que desbloquean a otras (dependencias críticas)
2. **Segundo:** valor alto + complejidad baja (quick wins)
3. **Tercero:** valor alto + complejidad moderada/alta
4. **Cuarto:** valor medio, independientes
5. **Último:** valor bajo o historias "futuro" que entraron por error

## Paso 4 — Actualizar backlog.json

Reescribe el array `historias` con el nuevo orden y actualiza las prioridades (`Alta` / `Media` / `Baja`) de acuerdo a la clasificación.

## Paso 5 — Reportar decisión

```bash
curl -s -X POST "${STATE_URL}/api/projects/${SLUG}/decisions" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY}" \
  -d '{
    "agente": "product_owner",
    "tipo": "decision",
    "contenido": "Backlog repriorizado: [describe el orden resultante y el criterio principal usado]",
    "origen": "agente"
  }'
```

## Paso 6 — Entregable

Presenta el backlog ordenado en formato tabla:

| # | ID | Título | Prioridad | Razón |
|---|---|---|---|---|
| 1 | US-XX | ... | Alta | desbloquea US-YY |
| 2 | US-YY | ... | Alta | valor alto, independiente |
| … | … | … | … | … |

Indica claramente cuál es la primera historia que debería entrar a refinamiento con el funcional.
