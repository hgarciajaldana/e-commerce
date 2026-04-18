---
name: definir-mvp
description: Define el MVP de una visión o funcionalidad recibida. Usar al inicio de cada sesión cuando el gerente entrega una nueva visión o solicitud de producto.
allowed-tools: Bash(curl *), Bash(python3 *), Read(*), Write(*), Edit(*)
---

Visión recibida: `$ARGUMENTS`

Ejecuta este proceso en orden para producir la definición del MVP.

## Paso 1 — Leer contexto existente

Si ya existe `mvp.json` o `backlog.json`, léelos para entender el estado actual del proyecto antes de definir el nuevo alcance.

## Paso 2 — Aplicar el filtro MVP

Para cada funcionalidad identificada en la visión, responde esta pregunta:
> **¿Sin esto, el producto NO puede cumplir su objetivo principal?**

- Si la respuesta es **sí** → entra al MVP
- Si la respuesta es **no** → va al backlog como "futuro"

Sé implacable. El MVP debe ser el conjunto mínimo que entrega valor real.

## Paso 3 — Documentar el MVP

Escribe o actualiza `mvp.json` con esta estructura:

```json
{
  "version": "v1",
  "objetivo": "qué problema resuelve este MVP",
  "dentro_del_alcance": [
    {
      "id": "F-01",
      "titulo": "nombre de la funcionalidad",
      "justificacion": "por qué es esencial para el MVP"
    }
  ],
  "fuera_del_alcance": [
    {
      "id": "F-XX",
      "titulo": "nombre de la funcionalidad",
      "razon": "por qué se posterga",
      "para_cuando": "futuro / v2 / post-lanzamiento"
    }
  ],
  "criterio_de_exito": "cómo sabremos que el MVP fue exitoso"
}
```

## Paso 4 — Reportar decisión al state service

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
INTERNAL_KEY="${FABRICA_INTERNAL_KEY:-fabrica-internal-2026}"
SLUG="${FABRICA_SLUG:-proyecto}"

curl -s -X POST "${STATE_URL}/api/projects/${SLUG}/decisions" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY}" \
  -d '{
    "agente": "product_owner",
    "tipo": "decision",
    "contenido": "MVP definido: [lista las funcionalidades dentro del alcance y las excluidas]",
    "origen": "agente"
  }'
```

## Paso 5 — Entregable

Presenta al gerente un resumen ejecutivo:
- ✅ **Dentro del MVP:** [lista concisa]
- ❌ **Fuera del MVP:** [lista concisa con razón]
- 🎯 **Criterio de éxito:** [cómo se mide]

No continúes con la creación de historias hasta que el gerente confirme el alcance.
