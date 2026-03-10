import { Router } from "express";
import * as coleccionesController from "../../controllers/admin/colecciones.controller";

const router = Router();

// Auth + tenant ya aplicados en app.ts

// GET    /api/v1/admin/colecciones
router.get("/", coleccionesController.listColecciones);
// POST   /api/v1/admin/colecciones
router.post("/", coleccionesController.createColeccion);
// GET    /api/v1/admin/colecciones/:id
router.get("/:id", coleccionesController.getColeccion);
// PUT    /api/v1/admin/colecciones/:id
router.put("/:id", coleccionesController.updateColeccion);
// DELETE /api/v1/admin/colecciones/:id
router.delete("/:id", coleccionesController.deleteColeccion);
// GET    /api/v1/admin/colecciones/:id/productos
router.get("/:id/productos", coleccionesController.listProductosDeColeccion);
// POST   /api/v1/admin/colecciones/:id/productos
router.post("/:id/productos", coleccionesController.asignarProducto);
// DELETE /api/v1/admin/colecciones/:id/productos/:productoId
router.delete("/:id/productos/:productoId", coleccionesController.quitarProducto);

export default router;
