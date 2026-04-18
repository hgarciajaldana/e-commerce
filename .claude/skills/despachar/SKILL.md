---
name: despachar
description: Despacha un agente específico con un prompt personalizado
user-invocable: true
allowed-tools: Bash
argument-hint: "<agente> <prompt>"
---

# Despachar Agente

Despacha un agente del sistema con el prompt proporcionado.

**Agentes disponibles:** gerente, product_owner, funcional, arquitecto, orquestador, backend, frontend, dba, devops, tester, code_reviewer, openclaw

```bash
GESTOR_URL="http://localhost:6001"
SLUG="${FABRICA_SLUG}"

AGENTE=$(echo "$ARGUMENTS" | awk '{print $1}')
PROMPT=$(echo "$ARGUMENTS" | cut -d' ' -f2-)

if [ -z "$AGENTE" ]; then
  echo "Uso: /despachar <agente> <prompt>"
  echo "Agentes: gerente, product_owner, funcional, arquitecto, orquestador, backend, frontend, dba, devops, tester, code_reviewer, openclaw"
  exit 1
fi

echo "🚀 Despachando $AGENTE en $SLUG..."
RESP=$(curl -sf -X POST "$GESTOR_URL/api/projects/$SLUG/run-agent" \
  -H "Content-Type: application/json" \
  -d "{\"agente\":\"$AGENTE\",\"prompt\":\"$PROMPT\"}")

echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d.get('ok'):
  print(f'✅ {d.get(\"agente\")} despachado correctamente')
else:
  print(f'❌ Error: {d.get(\"error\",\"desconocido\")}')
" 2>/dev/null || echo "❌ Error de conexión con el gestor"
```

Confirma al usuario que el agente fue despachado.
