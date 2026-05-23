import { Router } from "express";
import {
  assignPermissionToRoleController,
  getAllRolesController,
  getRoleByIdController,
  getRolePermissionsController,
} from "./roles.controller";
import { requirePermission } from "../../middlewares/requirePermission";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("manage:permissions"), getAllRolesController);
router.get(
  "/:id",
  requirePermission("manage:permissions"),
  getRoleByIdController,
);
router.get(
  "/:id/permissions",
  requirePermission("manage:permissions"),
  getRolePermissionsController,
);
router.post(
  "/:id/permissions",
  requirePermission("manage:permissions"),
  assignPermissionToRoleController,
);

export default router;
