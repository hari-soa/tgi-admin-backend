import { Router } from "express";
import { authController } from "../controllers/authController";
import { validate } from "../middlewares/validateMiddlewares";
import { loginSchema } from "../dtos/authDto";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.getMe);

export default router;
