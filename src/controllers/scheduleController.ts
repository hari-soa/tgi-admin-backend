import { Request, Response, NextFunction } from "express";
import { ScheduleService } from "../services/scheduleService";

export class ScheduleController {
  public static async create(
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const timetable = await ScheduleService.createTimetable(
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
  }

  public static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const timetables = await ScheduleService.getAllTimetables();
      res.status(200).json({ status: "success", data: { timetables } });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const timetable = await ScheduleService.getTimetableById(req.params.id);
      res.status(200).json({ status: "success", data: { timetable } });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await ScheduleService.deleteTimetable(req.params.id);
      res
        .status(200)
        .json({ status: "success", message: "Timetable deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
