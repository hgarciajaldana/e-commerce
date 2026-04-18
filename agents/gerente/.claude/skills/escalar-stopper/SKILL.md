---
name: escalar-stopper
description: Escala un bloqueo o stopper al humano con contexto completo y opciones de resolución. Usar cuando un agente reporta estado "bloqueado" o cuando se detecta un stopper activo.
allowed-tools: Bash(curl *), Bash(python3 *)
---

Se ha detectado un bloqueo. Ejecuta los siguientes pasos:

## Paso 1 — Obtener detalle del stopper

```bash
curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/stoppers" \
  -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "
import json, sys
stoppers = json.load(sys.stdin).get('data', [])
activos = [s for s in stoppers if not s.get('resuelto', False)]
for s in activos:
    print(f\"ID: {s.get('id')}\")
    print(f\"Agente: {s.get('agente')}\")
    print(f\"Descripcion: {s.get('descripcion','')}\")
    print(f\"Creado: {s.get('created_at','')}\")
    print('---')
"
```

## Paso 2 — Obtener contexto del agente bloqueado

```bash
AGENTE_BLOQUEADO="<nombre del agente con el stopper>"

curl -s "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/agents/${AGENTE_BLOQUEADO}/state" \
  -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" | python3 -c "
import json, sys
data = json.load(sys.stdin).get('data', {})
print(f\"Estado: {data.get('estado')}\")
print(f\"Ultimo mensaje: {data.get('ultimo_mensaje','')}\")
"
```

## Paso 3 — Redactar escalación al humano

Presenta al humano con este formato:

```
🔴 BLOQUEO DETECTADO

Agente: <nombre>
Problema: <descripción clara y sin tecnicismos del stopper>

Contexto: <qué estaba haciendo el agente y por qué se bloqueó>

Opciones para resolverlo:
1. <opción A — ej. tomar decisión X>
2. <opción B — ej. proporcionar información Y>
3. <opción C — ej. cambiar el enfoque>

¿Cómo prefieres proceder?
```

## Paso 4 — Registrar en chat y cambiar estado

```bash
# Registrar mensaje en chat
curl -s -X POST "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/chat" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" \
  -d "{\"origen\": \"agente\", \"agente\": \"gerente\", \"contenido\": \"BLOQUEO: <descripción del stopper y opciones presentadas al humano>\"}"

# Cambiar estado a esperando
curl -s -X POST "${STATE_URL:-http://localhost:4000}/api/projects/${SLUG:-proyecto}/agents/gerente/state" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY:-fabrica-internal-2026}" \
  -d "{\"estado\": \"esperando\", \"ultimo_mensaje\": \"Stopper escalado al humano — esperando decision\"}"
```

## Paso 5 — Esperar decisión del humano

No despachar ningún agente hasta recibir respuesta explícita del humano. Una vez recibida:
- Si elige una opción → despacha al agente correspondiente con el contexto de la decisión
- Si da nueva instrucción → ejecuta `/plan-de-ataque` con esa instrucción
