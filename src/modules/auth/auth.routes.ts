import { Router } from "express";
import { loginController, logoutController } from "./auth.controller";
import { validate } from "../../middlewares/validate";
import { loginSchema } from "./auth.validator";
import { authRateLimiter } from "../../middlewares/rateLimiter";

const router = Router();

router.post("/login", authRateLimiter, validate(loginSchema), loginController);
router.post("/logout", logoutController);
export default router;
