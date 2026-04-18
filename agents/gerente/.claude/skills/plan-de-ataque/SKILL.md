---
name: plan-de-ataque
description: Estructura un plan de agentes para ejecutar una nueva instrucción o funcionalidad. Usar antes de despachar cuando la tarea involucra múltiples agentes o hay decisiones de orden.
argument-hint: "<descripción de la instrucción o funcionalidad>"
disable-model-invocation: true
---

Instrucción recibida: `$ARGUMENTS`

Construye un plan de ataque respondiendo estas preguntas en orden:

## 1. ¿Qué tipo de trabajo es?

Clasifica la instrucción en una de estas categorías:
- **Requisitos** → empieza con `product_owner`
- **Análisis funcional** → empieza con `funcional`
- **Decisión técnica** → empieza con `arquitecto`
- **Implementación directa** → empieza con `orquestador`
- **Solo base de datos** → empieza con `dba`
- **Solo infraestructura** → empieza con `devops`
- **Revisión / QA** → empieza con `tester` o `code_reviewer`

## 2. ¿Qué ambigüedades existen?

Lista explícitamente todo lo que NO está definido en la instrucción:
- Comportamiento esperado no especificado
- Tecnologías no confirmadas
- Dependencias no mencionadas
- Criterios de éxito ausentes

Si hay ambigüedades críticas → **detente y pregunta al humano antes de continuar**.

## 3. ¿Cuál es la secuencia de agentes?

Define la cadena en orden, justificando cada paso:

| # | Agente | Por qué | Depende de |
|---|--------|---------|-----------|
| 1 | `agente` | razón | — |
| 2 | `agente` | razón | resultado del paso 1 |
| … | … | … | … |

Reglas de secuenciación:
- `product_owner` / `funcional` siempre antes de `arquitecto`
- `arquitecto` siempre antes de `backend`, `frontend`, `dba`
- `orquestador` coordina a `backend` + `frontend` + `dba` en paralelo si aplica
- `tester` y `code_reviewer` siempre al final

## 4. ¿Cuál es el prompt de cada agente?

Para cada agente en la secuencia, redacta el prompt exacto que le darás. Debe incluir:
- Contexto de la tarea
- Entregables esperados
- Restricciones relevantes
- ID de tarea sugerido (ej. `T-01`, `T-02`)

## 5. Confirmación antes de ejecutar

Presenta el plan al humano de forma concisa:
- Secuencia de agentes
- Qué producirá cada uno
- Tiempo estimado aproximado

Espera aprobación explícita del humano antes de despachar el primer agente.
