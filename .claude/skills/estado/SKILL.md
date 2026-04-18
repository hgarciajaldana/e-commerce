---
name: estado
description: Muestra el estado completo del proyecto - agentes, tareas, stoppers, tokens
user-invocable: true
allowed-tools: Bash
argument-hint: "[slug]"
---

# Estado del Proyecto

Consulta y muestra el estado completo del proyecto actual.

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
KEY="${FABRICA_INTERNAL_KEY}"
SLUG="${FABRICA_SLUG:-$ARGUMENTS}"

echo "══════════════════════════════════════"
echo "  ESTADO: $SLUG"
echo "══════════════════════════════════════"

# Estado general
echo ""
echo "📋 PROYECTO:"
curl -sf -H "X-Internal-Key: $KEY" "$STATE_URL/api/projects/$SLUG" 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin).get('data',{})
print(f\"  Fase: {d.get('fase_actual','—')}\")
print(f\"  Status: {d.get('status','—')}\")
print(f\"  Agente actual: {d.get('current_agent','—')}\")
" 2>/dev/null

# Agentes
echo ""
echo "🤖 AGENTES:"
curl -sf -H "X-Internal-Key: $KEY" "$STATE_URL/api/projects/$SLUG/agents" 2>/dev/null | python3 -c "
import sys,json
for a in json.load(sys.stdin).get('data',[]):
  icon={'activo':'🔵','esperando':'⚪','completado':'✅','bloqueado':'🔴'}.get(a['estado'],'⚫')
  print(f\"  {icon} {a['agente']}: {a['estado']} — {a.get('ultimo_mensaje','')[:60]}\")
" 2>/dev/null

# Tareas
echo ""
echo "📝 TAREAS:"
curl -sf -H "X-Internal-Key: $KEY" "$STATE_URL/api/projects/$SLUG/tasks" 2>/dev/null | python3 -c "
import sys,json
tasks=json.load(sys.stdin).get('data',[])
by_estado={}
for t in tasks:
  e=t['estado']
  by_estado[e]=by_estado.get(e,0)+1
for e,c in sorted(by_estado.items()):
  print(f\"  {e}: {c}\")
print(f\"  Total: {len(tasks)}\")
" 2>/dev/null

# Stoppers
echo ""
echo "⚠️ STOPPERS ACTIVOS:"
curl -sf -H "X-Internal-Key: $KEY" "$STATE_URL/api/projects/$SLUG/stoppers/activos" 2>/dev/null | python3 -c "
import sys,json
stoppers=json.load(sys.stdin).get('data',[])
if not stoppers: print('  Ninguno')
for s in stoppers:
  print(f\"  🔴 [{s['agente']}] {s['descripcion'][:80]}\")
" 2>/dev/null

# Tokens
echo ""
echo "💰 TOKENS:"
curl -sf -H "X-Internal-Key: $KEY" "$STATE_URL/api/projects/$SLUG/tokens/summary" 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin).get('data',{})
t=d.get('totales',{})
print(f\"  Input: {t.get('total_entrada',0):,} | Output: {t.get('total_salida',0):,}\")
print(f\"  Costo estimado: \${t.get('costo_total',0):.4f}\")
" 2>/dev/null

echo ""
echo "══════════════════════════════════════"
```

Muestra el resultado formateado al usuario.
