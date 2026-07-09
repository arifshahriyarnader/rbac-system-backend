import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { requirePermission } from "../../middlewares/requirePermission";
import { getAuditLogsController } from "./auditLog.controller";

const router = Router();

router.use(authenticate);

router.get("/", requirePermission("view:audit-log"), getAuditLogsController);

export default router;
