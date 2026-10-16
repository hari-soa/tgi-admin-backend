import { Request, Response, NextFunction } from "express";
import { scheduleService } from "../services/scheduleService";

export const scheduleController = {
  create: async (
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const timetable = await scheduleService.createTimetable(
        req.body,
        adminId,
      );
      res.status(201).json({
        status: "success",
        message: "Timetable created successfully",
        data: { timetable },
      });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const timetables = await scheduleService.getAllTimetables();
      res.status(200).json({ status: "success", data: { timetables } });
    } catch (error) {
      next(error);
    }
  },

  getById: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const timetable = await scheduleService.getTimetableById(req.params.id);
      res.status(200).json({ status: "success", data: { timetable } });
    } catch (error) {
      next(error);
    }
  },

  delete: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await scheduleService.deleteTimetable(req.params.id);
      res
        .status(200)
        .json({ status: "success", message: "Timetable deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};
