#!/bin/bash
# Hook: Stop — Auto-validación cuando un agente operativo termina
# Solo ejecuta si hay package.json en el proyecto

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ ! -f "package.json" ]; then
  exit 0
fi

ERRORS=0

# Build check
if command -v npx &> /dev/null; then
  npx tsc --noEmit 2>&1 | tail -5
  [ $? -ne 0 ] && ERRORS=$((ERRORS+1))
fi

# Lint check
if grep -q '"lint"' package.json 2>/dev/null; then
  npm run lint --silent 2>&1 | tail -5
  [ $? -ne 0 ] && ERRORS=$((ERRORS+1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "⚠️ Auto-validación: $ERRORS problemas detectados" >&2
  exit 2  # Exit 2 = block action, stderr as feedback
fi

echo "✅ Auto-validación: OK"
exit 0
