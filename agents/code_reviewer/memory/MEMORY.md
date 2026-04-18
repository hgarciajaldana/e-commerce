# Code Reviewer — Memory

## Proyecto
- Nombre: ecomerce
- Fase: definicion
- Stack: Node/Express/TypeScript backend, Prisma ORM
- Slug estado: ecomerce

## Revisiones completadas
- **T-stoppers-review (2026-03-01):** Verificación de 5 stoppers críticos del backend. Resultado: APROBADO. Todos los stoppers resueltos. Observación menor: doble aplicación de middlewares en admin router.

## Patrones observados
- Backend usa `/api/v1/` como prefijo global en `app.ts`
- Upload middleware exporta `uploadImage` (multer instance); campo multipart: `"file"`
- Admin router en `routes/admin/index.ts` aplica middlewares redundantes (ya aplicados en app.ts)
