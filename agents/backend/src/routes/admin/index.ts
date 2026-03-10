import { Router } from "express";
import { uploadImage } from "../../middleware/upload.middleware";

import * as categoriesController from "../../controllers/admin/categories.controller";
import * as productsController from "../../controllers/admin/products.controller";
import * as variantsController from "../../controllers/admin/variants.controller";
import * as imagesController from "../../controllers/admin/images.controller";
import * as storeConfigController from "../../controllers/admin/storeConfig.controller";
import * as ordersController from "../../controllers/admin/orders.controller";
import * as customersController from "../../controllers/admin/customers.controller";
import * as assetsController from "../../controllers/admin/assets.controller";
import coleccionesRoutes from "./colecciones.routes";
import pedidosRoutes from "./pedidos.routes";
import promocionesRoutes from "./promociones.routes";

const router = Router();

// Auth + tenant ya resueltos en app.ts (requireAuth → resolveAdminTenant → requireAdminRole)

// ── Categorías ──────────────────────────────────────────────
// GET    /api/admin/categories?page&limit&activo
router.get("/categories", categoriesController.listCategories);
// POST   /api/admin/categories
router.post("/categories", categoriesController.createCategory);
// GET    /api/admin/categories/:id
router.get("/categories/:id", categoriesController.getCategory);
// PUT    /api/admin/categories/:id
router.put("/categories/:id", categoriesController.updateCategory);
// DELETE /api/admin/categories/:id
router.delete("/categories/:id", categoriesController.deleteCategory);

// ── Productos ────────────────────────────────────────────────
// GET    /api/admin/products?categoriaId&busqueda&page&limit&activo
router.get("/products", productsController.listProducts);
// POST   /api/admin/products
router.post("/products", productsController.createProduct);
// GET    /api/admin/products/:id
router.get("/products/:id", productsController.getProduct);
// PUT    /api/admin/products/:id
router.put("/products/:id", productsController.updateProduct);
// DELETE /api/admin/products/:id
router.delete("/products/:id", productsController.deleteProduct);

// ── Variantes ────────────────────────────────────────────────
// GET    /api/admin/products/:id/variants
router.get("/products/:id/variants", variantsController.listVariants);
// POST   /api/admin/products/:id/variants
router.post("/products/:id/variants", variantsController.createVariant);
// PUT    /api/admin/products/:id/variants/:variantId
router.put("/products/:id/variants/:variantId", variantsController.updateVariant);
// DELETE /api/admin/products/:id/variants/:variantId
router.delete("/products/:id/variants/:variantId", variantsController.deleteVariant);

// ── Imágenes ─────────────────────────────────────────────────
// POST   /api/admin/products/:id/images (multipart o JSON con url)
router.post(
  "/products/:id/images",
  uploadImage.single("file"),
  imagesController.addImage
);
// DELETE /api/v1/admin/products/:id/images/:imageId
router.delete("/products/:id/images/:imageId", imagesController.deleteImage);

// ── Assets genéricos (logo, banner, slides) ───────────────────────────────
// POST /api/v1/admin/assets/upload
router.post("/assets/upload", uploadImage.single("file"), assetsController.uploadAsset);

// ── Configuración de tienda ───────────────────────────────────────────────
router.get("/store-config", storeConfigController.getStoreConfig);
router.put("/store-config", storeConfigController.updateStoreConfig);
router.get("/configuracion", storeConfigController.getStoreConfig);
router.put("/configuracion", storeConfigController.updateStoreConfig);

// ── Pedidos ───────────────────────────────────────────────────────────────
router.get("/orders", ordersController.listOrders);
router.get("/orders/:id", ordersController.getOrder);
router.patch("/orders/:id/status", ordersController.updateOrderStatus);
router.put("/orders/:id/status", ordersController.updateOrderStatus);
router.use("/pedidos", pedidosRoutes);

// ── Clientes ──────────────────────────────────────────────────────────────
router.get("/customers", customersController.listCustomers);
router.get("/customers/:id", customersController.getCustomer);
router.put("/customers/:id", customersController.updateCustomer);

// ── Colecciones ───────────────────────────────────────────────────────────
router.use("/colecciones", coleccionesRoutes);

// ── Promociones especiales ────────────────────────────────────────────────
router.use("/promociones-especiales", promocionesRoutes);

export default router;
