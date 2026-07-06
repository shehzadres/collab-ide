import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authRateLimit } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post("/register", authRateLimit, authController.register.bind(authController));
router.post("/login", authRateLimit, authController.login.bind(authController));
router.post("/refresh", authController.refresh.bind(authController));
router.post("/logout", authMiddleware, authController.logout.bind(authController));
router.get("/me", authMiddleware, authController.me.bind(authController));

export default router;
