import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requirePermission } from "../../middlewares/requirePermission";
import {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  suspendUserController,
  banUserController,
  activateUserController,
  getUserPermissionsController,
  overrideUserPermissionController,
  removeUserPermissionOverrideController,
} from "./users.controller";
import { createUserSchema } from "./validators/createUser.validator";
import { validate } from "../../middlewares/validate";
import { updateUserSchema } from "./validators/updateUser.validator";
import { userPermissionSchema } from "./validators/permissionUser.validator";

const router = Router();

router.use(authenticate);

router.get(
  "/all-users",
  requirePermission("view:users"),
  getAllUsersController,
);
router.get("/:id", requirePermission("view:users"), getUserByIdController);
router.post(
  "/create-user",
  requirePermission("manage:users"),
  validate(createUserSchema),
  createUserController,
);
router.patch(
  "/:id",
  requirePermission("manage:users"),
  validate(updateUserSchema),
  updateUserController,
);
router.patch(
  "/:id/suspend",
  requirePermission("manage:users"),
  suspendUserController,
);
router.patch("/:id/ban", requirePermission("manage:users"), banUserController);
router.patch(
  "/:id/activate",
  requirePermission("manage:users"),
  activateUserController,
);

router.get(
  "/:id/permissions",
  requirePermission("manage:permissions"),
  getUserPermissionsController,
);

router.post(
  "/:id/permissions",
  requirePermission("manage:permissions"),
  validate(userPermissionSchema),
  overrideUserPermissionController,
);

router.delete(
  "/:id/permissions/:permId",
  requirePermission("manage:permissions"),
  removeUserPermissionOverrideController,
);

export default router;
