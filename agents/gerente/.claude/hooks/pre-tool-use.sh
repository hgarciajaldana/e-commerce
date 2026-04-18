#!/bin/bash
# PreToolUse hook — Bloquea al gerente de usar herramientas de escritura de código
# Exit 0 = permitir, Exit 2 = bloquear (stderr se muestra al modelo como feedback)

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null)

case "$TOOL_NAME" in
  Edit|Write|MultiEdit|NotebookEdit)
    echo "🚫 BLOQUEADO: El gerente no puede usar la herramienta '${TOOL_NAME}'." >&2
    echo "" >&2
    echo "Tu rol es orquestar, no implementar. Delega esta tarea al agente que corresponde:" >&2
    echo "  • Cambios de código backend   → agente 'backend'" >&2
    echo "  • Cambios de código frontend  → agente 'frontend'" >&2
    echo "  • Cambios de base de datos    → agente 'dba'" >&2
    echo "  • Configuración / infra       → agente 'devops'" >&2
    echo "" >&2
    echo "Usa run-agent para despachar:" >&2
    echo "  curl -s -X POST \"http://localhost:6001/api/projects/\${FABRICA_SLUG}/run-agent\" \\" >&2
    echo "    -H \"Content-Type: application/json\" \\" >&2
    echo "    -d '{\"agente\": \"NOMBRE\", \"prompt\": \"descripción clara de la tarea\"}'" >&2
    exit 2
    ;;
esac

exit 0
