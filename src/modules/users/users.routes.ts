import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requirePermission } from "../../middlewares/requirePermission";
import {
  getAllUsersController,
  getUserByIdController,
} from "./users.controller";

const router = Router();

router.use(authenticate);

router.get(
  "/all-users",
  requirePermission("view:users"),
  getAllUsersController,
);
router.get("/:id", requirePermission("view:users"), getUserByIdController);

export default router;
