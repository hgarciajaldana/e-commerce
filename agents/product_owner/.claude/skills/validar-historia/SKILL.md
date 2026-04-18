---
name: validar-historia
description: Valida que una historia de usuario esté lista para pasar al funcional. Usar antes de marcar cualquier historia como "Lista". Es el gate de calidad obligatorio del PO.
argument-hint: "<ID de historia, ej: US-01>"
disable-model-invocation: true
allowed-tools: Read(*), Edit(*), Bash(curl *), Bash(python3 *)
---

Historia a validar: `$ARGUMENTS`

Lee la historia desde `backlog.json` y ejecuta este checklist completo. Cada punto debe cumplirse para que la historia sea aprobada.

## Checklist de validación

### Estructura
- [ ] Tiene ID único (US-XX)
- [ ] El título es descriptivo y conciso (máx 8 palabras)
- [ ] El campo "Como" especifica un rol real, no genérico ("usuario" a secas no cuenta)
- [ ] El campo "Quiero" describe una acción concreta, no un estado vago
- [ ] El campo "Para" expresa un beneficio real para el usuario, no un requisito técnico

### Criterios de aceptación
- [ ] Tiene al menos 2 criterios de aceptación
- [ ] Cada criterio es verificable por QA sin interpretación
- [ ] Ningún criterio menciona tecnología o implementación interna
- [ ] Los criterios cubren el flujo feliz (happy path)
- [ ] Los criterios cubren al menos un caso de error o edge case relevante

### Alcance y ambigüedad
- [ ] La historia está dentro del MVP definido en `mvp.json`
- [ ] No hay términos ambiguos sin definir ("rápido", "fácil", "intuitivo", "adecuado")
- [ ] El alcance de la historia es implementable en una sola iteración
- [ ] No depende de otra historia que todavía esté en estado "Pendiente" sin aclarar

### Independencia
- [ ] Se puede implementar y probar de forma independiente
- [ ] Si tiene dependencias, están documentadas en notas_tecnicas

---

## Resultado de la validación

**Si TODOS los puntos están marcados:**
- Actualiza el estado de la historia en `backlog.json` a `Lista`
- Reporta al state service:

```bash
STATE_URL="${FABRICA_SERVICE_URL:-http://localhost:4000}"
INTERNAL_KEY="${FABRICA_INTERNAL_KEY:-fabrica-internal-2026}"
SLUG="${FABRICA_SLUG:-proyecto}"

curl -s -X POST "${STATE_URL}/api/projects/${SLUG}/tasks" \
  -H "Content-Type: application/json" -H "X-Internal-Key: ${INTERNAL_KEY}" \
  -d '{
    "tarea_id": "[ID de la historia]",
    "agente": "product_owner",
    "titulo": "[título]",
    "estado": "completado",
    "detalle": "Historia validada y lista para refinamiento con funcional"
  }'
```

**Si algún punto falla:**
- Lista específicamente qué puntos fallaron y por qué
- Corrige la historia antes de intentar validarla nuevamente
- Si la ambigüedad no se puede resolver sin el gerente o el humano → escala con una decisión de tipo `stopper`
