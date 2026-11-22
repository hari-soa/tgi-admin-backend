import { RequestHandler } from "express";
import { specController } from "../controllers/specController";
import { authController } from "../controllers/authController";
import { userController } from "../controllers/userController";
import { subjectController } from "../controllers/subjectController";
import { announcementController } from "../controllers/announcementController";
import { disciplinaryController } from "../controllers/disciplinaryController";
import { teacherAttendanceController } from "../controllers/teacherAttendanceController";
import { gradeController } from "../controllers/gradeController";
import { resultController } from "../controllers/resultController";

export const operationHandlers: Record<string, RequestHandler> = {
  ...specController,
  ...authController,
  ...userController,
  ...subjectController,
  ...announcementController,
  ...disciplinaryController,
  ...teacherAttendanceController,
  ...gradeController,
  ...resultController,
};
