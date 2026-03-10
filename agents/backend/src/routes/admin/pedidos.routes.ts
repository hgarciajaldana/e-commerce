import { Router } from "express";
import * as pedidosController from "../../controllers/admin/pedidos.controller";

const router = Router();

// GET  /api/v1/admin/pedidos?estado=pendiente&page=1&limit=20
router.get("/", pedidosController.listPedidos);
// GET  /api/v1/admin/pedidos/:id
router.get("/:id", pedidosController.getPedido);
// PATCH /api/v1/admin/pedidos/:id/estado
router.patch("/:id/estado", pedidosController.updateEstadoPedido);

export default router;
