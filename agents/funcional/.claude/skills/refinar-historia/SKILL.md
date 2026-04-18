---
name: refinar-historia
description: Toma una historia de usuario del PO y la enriquece con reglas de negocio, validaciones, casos borde y criterios de aceptación completos. Usar para cada historia antes de liberarla al Arquitecto.
argument-hint: "<ID de historia, ej: US-01>"
disable-model-invocation: true
allowed-tools: Read(*), Write(*), Edit(*), Bash(curl *), Bash(python3 *)
---

Historia a refinar: `$ARGUMENTS`

Lee la historia desde `backlog.json` o `user_stories.json` y ejecuta este proceso completo.

## Paso 1 — Entender el contexto

Lee los archivos existentes para no contradecir decisiones previas:
- `business_rules.json` — reglas de negocio ya definidas
- `non_functional_requirements.json` — requerimientos técnicos del Arquitecto ya integrados
- `user_stories.json` — historias ya refinadas para mantener consistencia

## Paso 2 — Definir el flujo completo

Para la historia `$ARGUMENTS`, documenta:

**Flujo principal (happy path):**
1. Paso a paso de lo que el usuario hace
2. Lo que el sistema responde en cada paso
3. Condición de éxito

**Flujos alternativos:**
- ¿Qué pasa si el usuario cancela a mitad?
- ¿Qué pasa si hay datos opcionales vacíos?
- ¿Qué pasa si el usuario repite la acción?

**Flujos de error:**
- Entrada inválida → ¿qué mensaje muestra el sistema?
- Fallo de servicio externo → ¿cómo se degrada?
- Falta de permisos → ¿qué ve el usuario?

## Paso 3 — Definir reglas de negocio específicas

Lista todas las reglas que aplican a esta historia:
- Restricciones de valores (mínimos, máximos, formatos)
- Condiciones de negocio (quién puede hacer qué, cuándo)
- Comportamientos automáticos del sistema (cálculos, notificaciones, estados)
- Dependencias con otras entidades

Agrega estas reglas a `business_rules.json`.

## Paso 4 — Redactar criterios de aceptación completos

Estructura los criterios en cuatro categorías:

```
Criterios funcionales:
  - [ ] Dado [contexto], cuando [acción], entonces [resultado esperado]

Criterios de error:
  - [ ] Dado [entrada inválida], cuando [acción], entonces [mensaje de error específico]

Criterios técnicos (si aplica):
  - [ ] [requerimiento no funcional integrado del Arquitecto]

Criterios de seguridad (si aplica):
  - [ ] Solo usuarios con rol [X] pueden ejecutar esta acción
  - [ ] Toda acción de escritura genera log de auditoría
```

## Paso 5 — Guardar historia refinada

Actualiza o crea la entrada en `user_stories.json`:

```json
{
  "id": "US-XX",
  "titulo": "...",
  "como": "...",
  "quiero": "...",
  "para": "...",
  "flujo_principal": ["paso 1", "paso 2", "..."],
  "flujos_error": ["caso 1: ...", "caso 2: ..."],
  "reglas_negocio": ["RN-01", "RN-02"],
  "criterios_funcionales": ["..."],
  "criterios_error": ["..."],
  "criterios_tecnicos": ["..."],
  "criterios_seguridad": ["..."],
  "estado": "En refinamiento"
}
```

## Paso 6 — Reportar al state service

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
INTERNAL_KEY="${FABRICA_INTERNAL_KEY:-fabrica-internal-2026}"
SLUG="${FABRICA_SLUG:-proyecto}"

curl -s -X POST "${STATE_URL}/api/projects/${SLUG}/decisions" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY}" \
  -d "{
    \"agente\": \"funcional\",
    \"tipo\": \"decision\",
    \"contenido\": \"Historia $ARGUMENTS refinada: [resumen de reglas de negocio y criterios definidos]\",
    \"origen\": \"agente\"
  }"
```

## Paso 7 — Ejecutar validación

Antes de marcar como lista, ejecuta `/validar-historia-funcional $ARGUMENTS`.
