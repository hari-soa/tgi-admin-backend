import { Request, Response, NextFunction } from "express";
import { eventService } from "../services/eventService";

export const eventController = {
  create: async (
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const event = await eventService.createEvent(req.body, adminId);
      res.status(201).json({
        status: "success",
        message: "Event created successfully",
        data: { event },
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
      const events = await eventService.getAllEvents();
      res.status(200).json({ status: "success", data: { events } });
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
      const event = await eventService.getEventById(req.params.id);
      res.status(200).json({ status: "success", data: { event } });
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
      await eventService.deleteEvent(req.params.id);
      res
        .status(200)
        .json({ status: "success", message: "Event deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};
