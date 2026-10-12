import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import {
  createAdministratorSchema,
  createStudentSchema,
  createSecretarySchema,
} from "../dtos";

const router = Router();

router.use(authenticate);

router.post(
  "/admin",
  authorize("ADMIN"),
  validate(createAdministratorSchema),
  UserController.createAdministrator,
);

router.post(
  "/student",
  authorize("ADMIN", "SECRETARY"),
  validate(createStudentSchema),
  UserController.createStudent,
);

router.post(
  "/secretary",
  authorize("ADMIN"),
  validate(createSecretarySchema),
  UserController.createSecretary,
);

router.get("/:id", authorize("ADMIN", "SECRETARY"), UserController.getUserById);

export default router;
