import { Router } from "express";
import { requirePermission } from "../../middlewares/requirePermission";
import { authenticate } from "../../middlewares/authenticate";
import { getAllPermissionsController } from "./permissions.controller";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  requirePermission("manage:permissions"),
  getAllPermissionsController,
);

export default router;