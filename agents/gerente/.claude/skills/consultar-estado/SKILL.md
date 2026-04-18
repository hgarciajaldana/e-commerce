---
name: consultar-estado
description: Consulta el estado actual del proyecto incluyendo agentes activos, tareas, decisiones recientes y stoppers. Usar SIEMPRE antes de responder al humano sobre el proyecto.
allowed-tools: Bash(curl *), Bash(python3 *)
---

## Estado actual del proyecto — $SLUG

### Status general de agentes
!`curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/status" -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "import json,sys; d=json.load(sys.stdin).get('data',{}); agentes=d.get('agentes',{}); [print(f\"  {a}: {info.get('estado','?')} — {info.get('ultimo_mensaje','')[:120]}\") for a,info in agentes.items()]" 2>/dev/null || echo "  No disponible"`

### Tareas recientes (últimas 10)
!`curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/tasks" -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "import json,sys; tasks=json.load(sys.stdin).get('data',[]); [print(f\"  {t.get('tarea_id','?')}: [{t.get('estado','?')}] ({t.get('agente','?')}) {t.get('titulo','')}\") for t in tasks[-10:]]" 2>/dev/null || echo "  No disponible"`

### Stoppers activos
!`curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/stoppers" -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "import json,sys; data=json.load(sys.stdin).get('data',[]); activos=[s for s in data if not s.get('resuelto',False)]; [print(f\"  [BLOQUEADO] {s.get('agente','?')}: {s.get('descripcion','')[:200]}\") for s in activos] if activos else print('  Sin stoppers activos')" 2>/dev/null || echo "  No disponible"`

### Decisiones recientes (últimas 5)
!`curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/decisions?limit=5" -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "import json,sys; [print(f\"  [{d.get('tipo','?')}] {d.get('agente','?')}: {d.get('contenido','')[:200]}\") for d in json.load(sys.stdin).get('data',[])]" 2>/dev/null || echo "  No disponible"`

---

Con esta información actualizada, responde al humano sin asumir nada de memoria anterior. Si hay stoppers activos, mencionarlos primero.
