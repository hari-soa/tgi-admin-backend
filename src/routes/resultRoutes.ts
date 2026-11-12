import { Router } from "express";
import { resultController } from "../controllers/resultController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import {
  createAnnualResultSchema,
  updateAnnualResultSchema,
} from "../dtos/resultDto";

const router = Router();

router.use(authenticate);

router.get("/student/:studentId", resultController.getByStudent);

router.post(
  "/",
  authorize("SECRETARY"),
  validate(createAnnualResultSchema),
  resultController.create,
);

router.patch(
  "/:id/review",
  authorize("ADMIN"),
  validate(updateAnnualResultSchema),
  resultController.review,
);

router.get("/:id/pdf", resultController.exportPdf);

router.get("/:id", resultController.getById);

export default router;
