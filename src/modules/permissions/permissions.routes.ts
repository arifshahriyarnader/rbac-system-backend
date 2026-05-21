import { Router } from "express";
import { requirePermission } from "../../middlewares/requirePermission";
import { authenticate } from "../../middlewares/authenticate";
import {
  getAllPermissionsController,
  getPermissionByIdController,
} from "./permissions.controller";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  requirePermission("manage:permissions"),
  getAllPermissionsController,
);

router.get(
  "/:id",
  requirePermission("manage:permissions"),
  getPermissionByIdController,
);

export default router;
