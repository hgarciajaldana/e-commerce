---
name: despachar-agente
description: Despacha un agente especializado, espera que arranque, espera que finalice y lee sus resultados. Usar cuando hay una tarea clara y sin ambigüedades lista para ejecutarse.
argument-hint: <agente> "<prompt completo de la tarea>"
disable-model-invocation: true
allowed-tools: Bash(curl *), Bash(python3 *), Bash(sleep *), Bash(seq *), Bash(echo *)
---

Vas a despachar un agente. Argumento recibido: `$ARGUMENTS`

Parsea el primer token como nombre del agente y el resto como el prompt de la tarea.

Ejecuta los siguientes pasos en orden, sin saltarte ninguno:

## Paso 1 — Reportar propio estado como "activo"

```bash
curl -s -X POST "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/agents/gerente/state" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" \
  -d "{\"estado\": \"activo\", \"ultimo_mensaje\": \"Despachando agente: el primer token de '$ARGUMENTS'\"}"
```

## Paso 2 — Despachar el agente vía gestor

```bash
AGENTE="<primer token de $ARGUMENTS>"
PROMPT="<resto de $ARGUMENTS>"

curl -s -X POST "http://localhost:6001/api/projects/${SLUG:-proyecto}/run-agent" \
  -H "Content-Type: application/json" \
  -d "{\"agente\": \"${AGENTE}\", \"prompt\": \"${PROMPT}\"}"
```

## Paso 3 — Esperar arranque (máx 2 minutos)

Haz poll cada 5 segundos hasta que el agente reporte estado `activo`:

```bash
for i in $(seq 1 24); do
  ESTADO=$(curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/agents/${AGENTE}/state" \
    -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | \
    python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('estado',''))" 2>/dev/null)
  echo "Intento $i — estado: $ESTADO"
  [ "$ESTADO" = "activo" ] && break
  sleep 5
done
```

## Paso 4 — Esperar finalización (máx 15 minutos)

Haz poll cada 5 segundos hasta que el agente reporte `esperando` o `bloqueado`:

```bash
for i in $(seq 1 180); do
  ESTADO=$(curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/agents/${AGENTE}/state" \
    -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | \
    python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('estado',''))" 2>/dev/null)
  echo "Intento $i — estado: $ESTADO"
  [ "$ESTADO" = "esperando" ] || [ "$ESTADO" = "bloqueado" ] && break
  sleep 5
done
```

## Paso 5 — Leer resultados

```bash
# Tareas del agente
curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/tasks" \
  -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "
import json, sys
tasks = json.load(sys.stdin).get('data', [])
mine = [t for t in tasks if t.get('agente') == '${AGENTE}']
for t in mine:
    print(f\"{t.get('tarea_id')}: [{t.get('estado')}] {t.get('titulo','')} — {t.get('detalle','')[:300]}\")
"

# Decisiones y stoppers recientes
curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/decisions?limit=5" \
  -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "
import json, sys
for d in json.load(sys.stdin).get('data', []):
    print(f\"[{d.get('tipo')}] {d.get('agente')}: {d.get('contenido','')[:200]}\")
"

# Stoppers activos
curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/stoppers" \
  -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "
import json, sys
activos = [s for s in json.load(sys.stdin).get('data',[]) if not s.get('resuelto',False)]
for s in activos:
    print(f\"[STOPPER] {s.get('agente')}: {s.get('descripcion','')[:300]}\")
"
```

## Paso 6 — Sintetizar y reportar al humano

Con los resultados anteriores:
- Resume qué hizo el agente en términos ejecutivos (sin tecnicismos)
- Si hay stoppers, escala inmediatamente usando la skill `escalar-stopper`
- Registra el mensaje al humano en el chat del state service
- Cambia tu estado a `esperando`
