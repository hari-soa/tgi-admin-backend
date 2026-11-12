import { Router } from "express";
import { teacherAttendanceController } from "../controllers/teacherAttendanceController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import {
  createAttendanceSlotSchema,
  checkAttendanceSchema,
  updateAttendanceMotifSchema,
  updateAttendanceSlotSchema,
} from "../dtos/teacherAttendanceDto";

export const router = Router();

router.post(
  "/slots",
  authenticate,
  authorize("ADMIN"),
  validate(createAttendanceSlotSchema),
  teacherAttendanceController.createSlot,
);

router.get(
  "/daily",
  authenticate,
  authorize("ADMIN"),
  teacherAttendanceController.getDailyCards,
);

router.post(
  "/check",
  authenticate,
  authorize("ADMIN"),
  validate(checkAttendanceSchema),
  teacherAttendanceController.checkAttendance,
);

router.patch(
  "/slots/:slotId/motif",
  authenticate,
  authorize("ADMIN"),
  validate(updateAttendanceMotifSchema),
  teacherAttendanceController.updateMotif,
);

router.get(
  "/summaries",
  authenticate,
  authorize("ADMIN"),
  teacherAttendanceController.getSummaryCards,
);

router.patch(
  "/slots/:slotId",
  authenticate,
  authorize("ADMIN"),
  validate(updateAttendanceSlotSchema),
  teacherAttendanceController.updateSlot,
);

router.delete(
  "/slots/:slotId",
  authenticate,
  authorize("ADMIN"),
  teacherAttendanceController.deleteSlot,
);

export default router;
