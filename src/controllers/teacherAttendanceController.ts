import { Request, Response, NextFunction } from "express";
import { teacherAttendanceService } from "../services/teacherAttendanceService";

export const teacherAttendanceController = {
  createSlot: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const slot = await teacherAttendanceService.createSlot(req.body);
      res.status(201).json({ status: "success", data: slot });
    } catch (error) {
      next(error);
    }
  },

  getDailyCards: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { day, date } = req.query;
      const cards = await teacherAttendanceService.getDailyCards(
        day as string,
        date as string,
      );
      res.status(200).json({ status: "success", data: cards });
    } catch (error) {
      next(error);
    }
  },

  checkAttendance: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { slotId, attendanceDate } = req.body;
      const userId = (req as any).user.id;
      const attendance = await teacherAttendanceService.checkAttendance(
        slotId,
        attendanceDate,
        userId,
      );
      res.status(200).json({ status: "success", data: attendance });
    } catch (error) {
      next(error);
    }
  },

  updateMotif: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const slotId = req.params.slotId as string;
      const { attendanceDate, motif } = req.body;
      const userRole = (req as any).user.role;
      const attendance = await teacherAttendanceService.updateMotif(
        slotId,
        attendanceDate,
        motif,
        userRole,
      );
      res.status(200).json({ status: "success", data: attendance });
    } catch (error) {
      next(error);
    }
  },

  updateSlot: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const slotId = req.params.slotId as string;
      const updated = await teacherAttendanceService.updateSlot(
        slotId,
        req.body,
      );
      res.status(200).json({ status: "success", data: updated });
    } catch (error) {
      next(error);
    }
  },

  deleteSlot: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const slotId = req.params.slotId as string;
      await teacherAttendanceService.deleteSlot(slotId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  getSummaryCards: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { teacherId } = req.query;
      const summaries = await teacherAttendanceService.getSummaryCards(
        teacherId as string,
      );
      res.status(200).json({ status: "success", data: summaries });
    } catch (error) {
      next(error);
    }
  },
};
