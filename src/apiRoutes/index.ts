import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/users.routes";
import permissionsRoutes from "../modules/permissions/permissions.routes";
import rolesRoutes from "../modules/roles/roles.routes";
import auditLogRoutes from "../modules/audit-log/auditLog.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/permissions", permissionsRoutes);
router.use("/roles", rolesRoutes);
router.use("/audit-logs", auditLogRoutes);

export default router;
