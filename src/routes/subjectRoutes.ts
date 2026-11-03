import { Router } from "express";
import { subjectController } from "../controllers/subjectController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createSubjectSchema, updateSubjectSchema } from "../dtos/subjectDto";

const router = Router();

router.use(authenticate);

router.get("/", subjectController.getAll);
router.get("/:id", subjectController.getById);

router.post(
  "/",
  authorize("ADMIN"),
  validate(createSubjectSchema),
  subjectController.create,
);

router.patch(
  "/:id",
  authorize("ADMIN"),
  validate(updateSubjectSchema),
  subjectController.update,
);

router.delete("/:id", authorize("ADMIN"), subjectController.delete);

export default router;
