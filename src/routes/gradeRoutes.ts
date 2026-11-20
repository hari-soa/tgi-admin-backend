import { Router } from "express";
import { gradeController } from "../controllers/gradeController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import {
  createGradeSchema,
  updateGradeSchema,
  reviewGradeSchema,
  createGradeSessionSchema,
  saveGradeSessionDraftSchema,
  submitGradeSessionSchema,
} from "../dtos/gradeDto";

const router = Router();

router.use(authenticate);

router.get("/", authorize("ADMIN", "SECRETARY"), gradeController.getAll);

router.post(
  "/",
  authorize("SECRETARY"),
  validate(createGradeSchema),
  gradeController.create,
);

// Grade sessions (declared before "/:id" so that "sessions" is not read as an id)
router.get(
  "/sessions",
  authorize("ADMIN", "SECRETARY"),
  gradeController.getSessions,
);

router.post(
  "/sessions",
  authorize("ADMIN"),
  validate(createGradeSessionSchema),
  gradeController.createSession,
);

router.put(
  "/sessions/:id/draft",
  authorize("SECRETARY"),
  validate(saveGradeSessionDraftSchema),
  gradeController.saveSessionDraft,
);

router.post(
  "/sessions/:id/submit",
  authorize("SECRETARY"),
  validate(submitGradeSessionSchema),
  gradeController.submitSession,
);

router.patch(
  "/sessions/:id/validate",
  authorize("ADMIN"),
  gradeController.validateSession,
);

router.get("/:id", authorize("ADMIN", "SECRETARY"), gradeController.getById);

router.put(
  "/:id",
  authorize("ADMIN", "SECRETARY"),
  validate(updateGradeSchema),
  gradeController.update,
);

router.patch(
  "/:id/review",
  authorize("ADMIN"),
  validate(reviewGradeSchema),
  gradeController.review,
);

router.delete("/:id", authorize("ADMIN"), gradeController.delete);

export default router;
