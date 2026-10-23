import { Router } from "express";
import { authController } from "../controllers/authController";
import { validate } from "../middlewares/validateMiddlewares";
import { loginSchema } from "../dtos/authDto";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);

export default router;
