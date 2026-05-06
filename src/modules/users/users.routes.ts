import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requirePermission } from "../../middlewares/requirePermission";
import {
  createUserController,
  getAllUsersController,
  getUserByIdController,
} from "./users.controller";
import { createUserSchema } from "./validators/createUser.validator";
import { validate } from "../../middlewares/validate";

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

export default router;
