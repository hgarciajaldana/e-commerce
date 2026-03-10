import { Router } from "express";
import * as ctrl from "../../controllers/admin/promociones.controller";

const router = Router();

router.get("/", ctrl.listPromociones);
router.post("/", ctrl.createPromocion);
router.get("/:id", ctrl.getPromocion);
router.put("/:id", ctrl.updatePromocion);
router.delete("/:id", ctrl.deletePromocion);

export default router;
