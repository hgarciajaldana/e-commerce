import { Router } from "express";
import * as empresasController from "../../controllers/superadmin/empresas.controller";

const router = Router();

// ── Empresas ──────────────────────────────────────────────────────────────
// POST   /api/v1/superadmin/empresas
router.post("/empresas", empresasController.createEmpresa);
// GET    /api/v1/superadmin/empresas
router.get("/empresas", empresasController.listEmpresas);
// GET    /api/v1/superadmin/empresas/:id
router.get("/empresas/:id", empresasController.getEmpresa);
// PATCH  /api/v1/superadmin/empresas/:id/activar
router.patch("/empresas/:id/activar", empresasController.activarEmpresa);
// PATCH  /api/v1/superadmin/empresas/:id/desactivar
router.patch("/empresas/:id/desactivar", empresasController.desactivarEmpresa);

export default router;
