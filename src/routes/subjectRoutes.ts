import { Router } from "express";
import { SubjectController } from "../controllers/subjectController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createSubjectSchema } from "../dtos/subjectDto";

const router = Router();

router.use(authenticate);

router.get("/", SubjectController.getAll);
router.get("/:id", SubjectController.getById);

router.post(
  "/",
  authorize("ADMIN"),
  validate(createSubjectSchema),
  SubjectController.create,
);

router.delete("/:id", authorize("ADMIN"), SubjectController.delete);

export default router;
