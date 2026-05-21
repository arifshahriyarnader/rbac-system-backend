import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/users.routes";
import permissionsRoutes from "../modules/permissions/permissions.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/permissions", permissionsRoutes);

export default router;
