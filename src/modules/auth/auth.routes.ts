import { Router } from "express";
import { loginController } from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { loginSchema } from "./auth.validator";
import { authRateLimiter } from "../../middlewares/rateLimiter";

const router = Router();

// POST /api/v1/auth/login
router.post(
  "/login",
  authRateLimiter, // ✅ brute force protection
  validate(loginSchema), // ✅ zod validation
  loginController, // ✅ controller
);

export default router;
