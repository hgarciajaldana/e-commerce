---
name: validar
description: Ejecuta validación completa del proyecto (build, lint, tests, docker)
user-invocable: true
allowed-tools: Bash
---

# Validar Proyecto

Ejecuta todas las validaciones del proyecto actual y reporta resultados.

```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "══════════════════════════════════════"
echo "  VALIDACIÓN DEL PROYECTO"
echo "══════════════════════════════════════"
echo ""

PASS=0; FAIL=0; SKIP=0

echo "📦 BUILD:"
if [ -f "package.json" ]; then
  if npx tsc --noEmit 2>&1 | tail -5; then
    echo "  ✅ TypeScript OK"; PASS=$((PASS+1))
  else
    echo "  ❌ TypeScript FALLÓ"; FAIL=$((FAIL+1))
  fi
else echo "  ⏭ Sin package.json"; SKIP=$((SKIP+1)); fi

echo ""
echo "🔍 LINT:"
if grep -q '"lint"' package.json 2>/dev/null; then
  if npm run lint --silent 2>&1 | tail -5; then
    echo "  ✅ Lint OK"; PASS=$((PASS+1))
  else
    echo "  ❌ Lint FALLÓ"; FAIL=$((FAIL+1))
  fi
else echo "  ⏭ Sin script lint"; SKIP=$((SKIP+1)); fi

echo ""
echo "🧪 TESTS:"
if grep -q '"test"' package.json 2>/dev/null; then
  if npm test 2>&1 | tail -10; then
    echo "  ✅ Tests OK"; PASS=$((PASS+1))
  else
    echo "  ❌ Tests FALLARON"; FAIL=$((FAIL+1))
  fi
else echo "  ⏭ Sin script test"; SKIP=$((SKIP+1)); fi

echo ""
echo "🐳 DOCKER:"
if [ -f "docker-compose.yml" ]; then
  if docker compose config > /dev/null 2>&1; then
    echo "  ✅ Docker Compose válido"; PASS=$((PASS+1))
  else
    echo "  ❌ Docker Compose inválido"; FAIL=$((FAIL+1))
  fi
else echo "  ⏭ Sin docker-compose.yml"; SKIP=$((SKIP+1)); fi

echo ""
echo "🔐 ENV:"
if [ -f ".env.example" ]; then
  echo "  ✅ .env.example presente"; PASS=$((PASS+1))
else
  echo "  ⚠️ .env.example FALTA"; FAIL=$((FAIL+1))
fi

echo ""
echo "══════════════════════════════════════"
echo "  RESULTADO: ✅ $PASS | ❌ $FAIL | ⏭ $SKIP"
echo "══════════════════════════════════════"
```
