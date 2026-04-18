#!/bin/bash
# Stop hook — Fuerza a los agentes dev a reportar tareas completadas antes de terminar
# Se bloquea (exit 2) si hay tareas del agente en estado pendiente o en_progreso

STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
KEY="${FABRICA_INTERNAL_KEY}"
SLUG="${FABRICA_SLUG}"

# Inferir nombre del agente por el directorio de trabajo
AGENTE=$(basename "$PWD")

# Solo aplica a agentes operativos — no al gerente ni a roles de análisis
case "$AGENTE" in
  gerente|product_owner|funcional|arquitecto|agente_contexto|reporter)
    exit 0
    ;;
esac

# Sin vars de entorno no podemos consultar — dejamos pasar
if [ -z "$KEY" ] || [ -z "$SLUG" ] || [ -z "$AGENTE" ]; then
  exit 0
fi

# Consultar tareas pendientes/en_progreso de este agente
RESULT=$(curl -s --max-time 5 "${STATE_URL}/api/projects/${SLUG}/tasks" \
  -H "X-Internal-Key: ${KEY}" 2>/dev/null | python3 -c "
import json, sys, os
try:
  tasks = json.load(sys.stdin).get('data', [])
  agente = '${AGENTE}'
  incomplete = [
    t for t in tasks
    if t.get('agente') == agente
    and t.get('estado') not in ('completado', 'cancelado', 'bloqueado')
  ]
  for t in incomplete:
    tid = t.get('tarea_id', '?')
    desc = (t.get('descripcion') or '')[:80]
    est = t.get('estado', '?')
    print(f'  [{tid}] ({est}) {desc}')
  print(f'INCOMPLETE_COUNT:{len(incomplete)}')
except Exception as e:
  print('INCOMPLETE_COUNT:0')
" 2>/dev/null)

COUNT=$(echo "$RESULT" | grep -o 'INCOMPLETE_COUNT:[0-9]*' | cut -d: -f2)
TASK_LIST=$(echo "$RESULT" | grep -v '^INCOMPLETE_COUNT:')

if [ "${COUNT:-0}" -gt 0 ]; then
  echo "⚠️  STOP BLOQUEADO — Tienes ${COUNT} tarea(s) sin completar en el state service." >&2
  echo "" >&2
  echo "Tareas pendientes:" >&2
  echo "$TASK_LIST" >&2
  echo "" >&2
  echo "Por cada tarea que hayas completado, reporta ANTES de terminar:" >&2
  echo "" >&2
  echo "  curl -s -X PUT \"\${STATE_URL}/api/projects/\${SLUG}/tasks/{tarea_id}\" \\" >&2
  echo "    -H \"Content-Type: application/json\" \\" >&2
  echo "    -H \"X-Internal-Key: \${KEY}\" \\" >&2
  echo "    -d '{\"estado\":\"completado\",\"detalle\":\"[descripción de lo que se implementó]\"}'" >&2
  echo "" >&2
  echo "Si la tarea quedó bloqueada por algún motivo, márcala como 'bloqueado' con el detalle del problema." >&2
  exit 2
fi

exit 0
