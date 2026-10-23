import { Router } from "express";
import { disciplinaryController } from "../controllers/disciplinaryController";
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
  disciplinaryController.createHistoryRecord,
);

router.patch(
  "/history/:id",
  authorize("ADMIN"),
  validate(updateStudentHistoryRecordSchema),
  disciplinaryController.updateHistoryRecord,
);

router.delete(
  "/history/:id",
  authorize("ADMIN"),
  disciplinaryController.deleteHistoryRecord,
);

router.post(
  "/remarks",
  authorize("ADMIN"),
  validate(createStudentRemarkSchema),
  disciplinaryController.createRemark,
);

router.patch(
  "/remarks/:id",
  authorize("ADMIN"),
  validate(updateStudentRemarkSchema),
  disciplinaryController.updateRemark,
);

router.delete(
  "/remarks/:id",
  authorize("ADMIN"),
  disciplinaryController.deleteRemark,
);

export default router;
