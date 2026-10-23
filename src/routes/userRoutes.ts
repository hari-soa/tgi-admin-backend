import { Router } from "express";
import { userController } from "../controllers/userController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import {
  createAdministratorSchema,
  createStudentSchema,
  createSecretarySchema,
} from "../dtos/userDto";

const router = Router();

router.use(authenticate);

router.get("/me", userController.getMyProfile);

router.post(
  "/admin",
  authorize("ADMIN"),
  validate(createAdministratorSchema),
  userController.createAdministrator,
);

router.post(
  "/students",
  authorize("ADMIN", "SECRETARY"),
  validate(createStudentSchema),
  userController.createStudent,
);

router.post(
  "/secretary",
  authorize("ADMIN"),
  validate(createSecretarySchema),
  userController.createSecretary,
);

router.get("/:id", authorize("ADMIN", "SECRETARY"), userController.getUserById);
router.patch("/:id", authorize("ADMIN"), userController.updateUser);
router.delete("/:id", authorize("ADMIN"), userController.deactivateStudent);

export default router;
