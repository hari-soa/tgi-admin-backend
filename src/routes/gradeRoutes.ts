import { Router } from "express";
import { gradeController } from "../controllers/gradeController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import {
  createGradeSchema,
  submitGradeSessionSchema,
  reviewGradeSchema,
} from "../dtos/gradeDto";

const router = Router();

router.use(authenticate);

router.get("/:id", gradeController.getById);

router.post(
  "/",
  authorize("SECRETARY"),
  validate(createGradeSchema),
  gradeController.create,
);

router.post(
  "/session",
  authorize("SECRETARY"),
  validate(submitGradeSessionSchema),
  gradeController.submitSession,
);

router.patch(
  "/:id/review",
  authorize("ADMIN"),
  validate(reviewGradeSchema),
  gradeController.review,
);

export default router;
