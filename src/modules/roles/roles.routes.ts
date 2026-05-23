import { Router } from "express";
import { getAllRolesController } from "./roles.controller";
import { requirePermission } from "../../middlewares/requirePermission";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("manage:permissions"), getAllRolesController);

export default router;