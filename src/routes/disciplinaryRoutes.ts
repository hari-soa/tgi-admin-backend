import { Router } from "express";
import { DisciplinaryController } from "../controllers/disciplinaryController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import {
  createStudentHistoryRecordSchema,
  updateStudentHistoryRecordSchema,
} from "../dtos/studentHistoryDto";
import {
  createStudentRemarkSchema,
  updateStudentRemarkSchema,
} from "../dtos/studentRemarkDto";

const router = Router();

router.use(authenticate);

router.post(
  "/history",
  authorize("ADMIN"),
  validate(createStudentHistoryRecordSchema),
  DisciplinaryController.createHistoryRecord,
);

router.patch(
  "/history/:id",
  authorize("ADMIN"),
  validate(updateStudentHistoryRecordSchema),
  DisciplinaryController.updateHistoryRecord,
);

router.delete(
  "/history/:id",
  authorize("ADMIN"),
  DisciplinaryController.deleteHistoryRecord,
);

// --- Remarques (100% ADMIN) ---
router.post(
  "/remarks",
  authorize("ADMIN"),
  validate(createStudentRemarkSchema),
  DisciplinaryController.createRemark,
);

router.patch(
  "/remarks/:id",
  authorize("ADMIN"),
  validate(updateStudentRemarkSchema),
  DisciplinaryController.updateRemark,
);

router.delete(
  "/remarks/:id",
  authorize("ADMIN"),
  DisciplinaryController.deleteRemark,
);

export default router;
