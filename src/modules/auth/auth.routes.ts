import { Router } from "express";
import {
  loginController,
  logoutController,
  refreshTokenController,
} from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { loginSchema } from "./auth.validator";
import { authRateLimiter } from "../../middlewares/rateLimiter";

const router = Router();

router.post("/login", authRateLimiter, validate(loginSchema), loginController);
router.post("/logout", logoutController);
router.post("/refresh-token", refreshTokenController);
export default router;
