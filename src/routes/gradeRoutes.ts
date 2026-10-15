import { Router } from "express";
import { GradeController } from "../controllers/gradeController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createAnnualResultSchema } from "../dtos/resultDto";

const router = Router();

router.use(authenticate);

router.get("/:id", GradeController.getById);

router.post("/transcribe", authorize("SECRETARY"), GradeController.transcribe);

router.post(
  "/annual-results",
  authorize("SECRETARY"),
  validate(createAnnualResultSchema),
  GradeController.createAnnualResult,
);

router.patch(
  "/annual-results/:id/review",
  authorize("ADMIN"),
  GradeController.reviewResult,
);

export default router;
