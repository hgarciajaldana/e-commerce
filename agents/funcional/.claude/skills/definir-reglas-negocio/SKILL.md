---
name: definir-reglas-negocio
description: Documenta todas las reglas de negocio de una funcionalidad o módulo de forma sistemática. Usar cuando se identifica un conjunto de reglas que aplican a múltiples historias o cuando el PO entrega una funcionalidad nueva.
argument-hint: "<módulo o funcionalidad, ej: 'autenticacion' o 'carrito-de-compras'>"
disable-model-invocation: true
allowed-tools: Read(*), Write(*), Edit(*)
---

Módulo / funcionalidad: `$ARGUMENTS`

## Paso 1 — Leer contexto existente

Lee `business_rules.json` para ver las reglas ya definidas y evitar duplicados o contradicciones.

## Paso 2 — Identificar categorías de reglas

Para `$ARGUMENTS`, analiza y documenta reglas en cada una de estas categorías si aplican:

### Reglas de datos
- Formatos obligatorios (email, teléfono, fechas)
- Rangos válidos (mínimos, máximos, longitudes)
- Unicidad (campos que no pueden repetirse)
- Campos requeridos vs opcionales

### Reglas de estado
- Estados posibles de la entidad (ej: borrador → activo → inactivo)
- Transiciones permitidas entre estados
- Quién puede cambiar cada estado
- Efectos secundarios de cada transición

### Reglas de acceso
- Roles que pueden crear / leer / editar / eliminar
- Condiciones adicionales (ej: "solo el propietario puede editar")
- Restricciones temporales (ej: "no editable después de X horas")

### Reglas de cálculo
- Fórmulas o lógica automática del sistema
- Cuándo se recalcula
- Qué entidades afecta el cálculo

### Reglas de notificación
- Cuándo el sistema notifica
- A quién notifica
- Por qué canal

### Reglas de integración
- Dependencias con otros módulos
- Orden de operaciones requerido
- Comportamiento ante fallo de dependencia

## Paso 3 — Asignar IDs y guardar

Cada regla recibe un ID único: `RN-[módulo]-[número]` (ej: `RN-AUTH-01`).

Actualiza `business_rules.json`:

```json
{
  "modulo": "$ARGUMENTS",
  "reglas": [
    {
      "id": "RN-XX-01",
      "categoria": "datos | estado | acceso | calculo | notificacion | integracion",
      "descripcion": "descripción clara de la regla",
      "historias_afectadas": ["US-01", "US-02"],
      "prioridad": "obligatoria | recomendada"
    }
  ]
}
```

## Paso 4 — Vincular a historias afectadas

Identifica qué historias existentes en `user_stories.json` se ven afectadas por estas reglas y agrega los IDs de las reglas al campo `reglas_negocio` de cada historia.

## Paso 5 — Escalar si hay conflictos

Si alguna regla contradice otra ya existente, o si una regla implica un cambio de alcance → escala al PO antes de continuar.
