import { Request, Response } from "express";
import { teacherAttendanceService } from "../services/teacherAttendanceService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";
import {
  CheckAttendanceDto,
  CreateAttendanceSlotDto,
  MarkAbsenceDto,
  UpdateAttendanceMotifDto,
  UpdateAttendanceSlotDto,
} from "../dtos/teacherAttendanceDto";

type SlotParams = { slotId: string };
type DailyQuery = { day: string; date: string };
type SummaryQuery = { teacherId?: string };

export const teacherAttendanceController = {
  createSlot: catchAsync(
    async (
      req: Request<unknown, unknown, CreateAttendanceSlotDto>,
      res: Response,
    ): Promise<void> => {
      const slot = await teacherAttendanceService.createSlot(req.body);
      res.status(201).json({
        status: "success",
        message: "Attendance slot created successfully",
        data: { slot },
      });
    },
  ),

  updateSlot: catchAsync(
    async (
      req: Request<SlotParams, unknown, UpdateAttendanceSlotDto>,
      res: Response,
    ): Promise<void> => {
      const slot = await teacherAttendanceService.updateSlot(
        req.params.slotId,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Attendance slot updated successfully",
        data: { slot },
      });
    },
  ),

  deleteSlot: catchAsync(
    async (req: Request<SlotParams>, res: Response): Promise<void> => {
      await teacherAttendanceService.deleteSlot(req.params.slotId);
      res.status(204).send();
    },
  ),

  getDailyCards: catchAsync(
    async (req: Request, res: Response): Promise<void> => {
      // day and date are guaranteed by dailyAttendanceQuerySchema
      const { day, date } = req.query as DailyQuery;
      const cards = await teacherAttendanceService.getDailyCards(day, date);
      res.status(200).json({
        status: "success",
        results: cards.length,
        data: { cards },
      });
    },
  ),

  checkAttendance: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CheckAttendanceDto>,
      res: Response,
    ): Promise<void> => {
      const attendance = await teacherAttendanceService.checkAttendance(
        req.body,
        req.user!.userId,
      );
      res.status(200).json({
        status: "success",
        message: "Attendance recorded successfully",
        data: { attendance },
      });
    },
  ),

  markAbsence: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, MarkAbsenceDto>,
      res: Response,
    ): Promise<void> => {
      const attendance = await teacherAttendanceService.markAbsence(
        req.body,
        req.user!.userId,
      );
      res.status(200).json({
        status: "success",
        message: "Absence recorded successfully",
        data: { attendance },
      });
    },
  ),

  updateMotif: catchAsync(
    async (
      req: Request<SlotParams, unknown, UpdateAttendanceMotifDto>,
      res: Response,
    ): Promise<void> => {
      const attendance = await teacherAttendanceService.updateMotif(
        req.params.slotId,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Motif updated successfully",
        data: { attendance },
      });
    },
  ),

  getSummaryCards: catchAsync(
    async (
      req: Request<unknown, unknown, unknown, SummaryQuery>,
      res: Response,
    ): Promise<void> => {
      const summaries = await teacherAttendanceService.getSummaryCards(
        req.query.teacherId,
      );
      res.status(200).json({
        status: "success",
        results: summaries.length,
        data: { summaries },
      });
    },
  ),
};
