import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requirePermission } from "../../middlewares/requirePermission";
import { getAllUsersController } from "./users.controller";

const router = Router();

router.use(authenticate);

router.get("/all-users", requirePermission("view:users"), getAllUsersController);

export default router;
