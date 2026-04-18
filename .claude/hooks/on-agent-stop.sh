#!/bin/bash
# Hook: SubagentStop — Reportar al State Service cuando un agente termina
# Se ejecuta automáticamente al terminar cualquier subagente

STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
KEY="${FABRICA_INTERNAL_KEY}"
SLUG="${FABRICA_SLUG}"

# El nombre del agente viene como argumento o variable de entorno
AGENTE="${1:-unknown}"

if [ -n "$KEY" ] && [ -n "$SLUG" ] && [ "$SLUG" != "" ]; then
  curl -sf -X POST "$STATE_URL/api/projects/$SLUG/agents/$AGENTE/state" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Key: $KEY" \
    -d "{\"estado\":\"esperando\",\"ultimo_mensaje\":\"Proceso finalizado\"}" \
    > /dev/null 2>&1
fi
