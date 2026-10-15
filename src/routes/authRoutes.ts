import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validate } from "../middlewares/validateMiddlewares";
import { loginSchema } from "../dtos/authDto";

const router = Router();

router.post("/login", validate(loginSchema), AuthController.login);

export default router;
