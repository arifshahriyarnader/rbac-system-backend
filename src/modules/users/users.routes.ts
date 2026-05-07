import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requirePermission } from "../../middlewares/requirePermission";
import {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
} from "./users.controller";
import { createUserSchema } from "./validators/createUser.validator";
import { validate } from "../../middlewares/validate";
import { updateUserSchema } from "./validators/updateUser.validator";

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

export default router;
