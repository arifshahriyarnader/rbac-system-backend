import { Router } from "express";
import {
  getMeController,
  loginController,
  logoutController,
  refreshTokenController,
} from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { loginSchema } from "./auth.validator";
import { authRateLimiter } from "../../middlewares/rateLimiter";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.post("/login", authRateLimiter, validate(loginSchema), loginController);
router.post("/logout", logoutController);
router.post("/refresh-token", refreshTokenController);
router.get("/me", authenticate, getMeController);

export default router;
