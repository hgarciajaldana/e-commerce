import { Router } from "express";
import * as storeController from "../../controllers/store/store.controller";

const router = Router();

// ── Config pública ────────────────────────────────────────────────────────
router.get("/config", storeController.getPublicConfig);

// ── Categorías ────────────────────────────────────────────────────────────
router.get("/categories", storeController.listCategorias);
router.get("/categorias", storeController.listCategorias);

// ── Catálogo ──────────────────────────────────────────────────────────────
router.get("/products", storeController.listProductos);
router.get("/products/:id", storeController.getProducto);
router.get("/productos", storeController.listProductos);
router.get("/productos/:slug", storeController.getProducto);

// ── Promociones ───────────────────────────────────────────────────────────
router.get("/promociones", storeController.getPromociones);

// ── Colecciones públicas ──────────────────────────────────────────────────
router.get("/colecciones", storeController.listColeccionesPublicas);
router.get("/colecciones/:slug", storeController.getColeccionPublica);

// ── Promociones especiales públicas ───────────────────────────────────────
router.get("/promociones-especiales", storeController.listPromocionesEspeciales);

// ── Carrito ───────────────────────────────────────────────────────────────
// POST /api/v1/store/carrito
router.post("/carrito", storeController.createCarrito);
// GET  /api/v1/store/carrito/:id
router.get("/carrito/:id", storeController.getCarrito);
// POST /api/v1/store/carrito/:id/items
router.post("/carrito/:id/items", storeController.addItemToCarrito);
// PUT  /api/v1/store/carrito/:id/items/:itemId
router.put("/carrito/:id/items/:itemId", storeController.updateCarritoItem);
// DELETE /api/v1/store/carrito/:id/items/:itemId
router.delete("/carrito/:id/items/:itemId", storeController.removeCarritoItem);

// ── Clientes ──────────────────────────────────────────────────────────────
router.get("/clientes/lookup", storeController.lookupCliente);

// ── Checkout ──────────────────────────────────────────────────────────────
// POST /api/v1/store/checkout  (alias /checkout/whatsapp)
router.post("/checkout", storeController.checkoutWhatsapp);
router.post("/checkout/whatsapp", storeController.checkoutWhatsapp);

export default router;
