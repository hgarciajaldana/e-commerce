---
name: validar-historia-funcional
description: Valida que una historia de usuario esté completa y sin ambigüedad antes de liberarla al Arquitecto. Gate de calidad obligatorio del Funcional.
argument-hint: "<ID de historia, ej: US-01>"
disable-model-invocation: true
allowed-tools: Read(*), Edit(*), Bash(curl *), Bash(python3 *)
---

Historia a validar: `$ARGUMENTS`

Lee la historia desde `user_stories.json` y ejecuta este checklist completo. **Todos los puntos deben cumplirse** para aprobar.

## Checklist funcional

### Flujo y comportamiento
- [ ] El flujo principal está documentado paso a paso
- [ ] Se documenta al menos un flujo de error relevante
- [ ] El sistema tiene una respuesta definida para cada acción del usuario
- [ ] No hay pasos del flujo que digan "el sistema hace algo" sin especificar qué

### Criterios de aceptación — funcionales
- [ ] Tiene al menos 2 criterios funcionales en formato "dado / cuando / entonces"
- [ ] Cada criterio es verificable por QA sin interpretación
- [ ] El happy path tiene criterio de éxito explícito
- [ ] Al menos un criterio de error con mensaje específico

### Criterios de aceptación — técnicos y seguridad
- [ ] Si hay requerimientos técnicos del Arquitecto aplicables, están integrados como criterios
- [ ] Si la historia involucra autenticación, hay criterio de seguridad
- [ ] Si la historia escribe datos, se evaluó si requiere auditoría

### Reglas de negocio
- [ ] Todas las reglas de negocio que aplican están referenciadas (IDs de RN)
- [ ] No hay contradicción entre las reglas de negocio y los criterios de aceptación
- [ ] Los casos borde identificados en las reglas tienen criterio de aceptación correspondiente

### Completitud general
- [ ] No hay términos vagos sin definir ("rápido", "amigable", "apropiado", "suficiente")
- [ ] Los roles de usuario están definidos con precisión
- [ ] Las entidades de datos mencionadas están descritas (campos, tipos, restricciones)
- [ ] Si hay dependencias con otras historias, están documentadas

---

## Resultado

**Si TODOS los puntos están marcados:**

Actualiza el estado en `user_stories.json` a `Lista` y reporta al state service:

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
INTERNAL_KEY="${FABRICA_INTERNAL_KEY:-fabrica-internal-2026}"
SLUG="${FABRICA_SLUG:-proyecto}"

curl -s -X POST "${STATE_URL}/api/projects/${SLUG}/tasks" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY}" \
  -d "{
    \"tarea_id\": \"$ARGUMENTS\",
    \"agente\": \"funcional\",
    \"titulo\": \"Historia $ARGUMENTS validada y lista para Arquitecto\",
    \"estado\": \"completado\",
    \"detalle\": \"Historia con criterios funcionales, de error, técnicos y reglas de negocio completos\"
  }"
```

**Si algún punto falla:**
- Lista exactamente qué puntos fallaron y por qué
- Vuelve a `/refinar-historia $ARGUMENTS` para corregir
- Si la ambigüedad no puede resolverse sin el PO → usa `/reportar-bloqueo funcional "<descripción>"`
