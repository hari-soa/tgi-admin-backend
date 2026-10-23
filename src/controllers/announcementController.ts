import { Request, Response, NextFunction } from "express";
import { announcementService } from "../services/announcementService";

export const announcementController = {
  create: async (
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authorId = req.user!.userId;
      const { targetClasses, ...dto } = req.body;
      const announcement = await announcementService.createAnnouncement(
        dto,
        authorId,
        targetClasses,
      );

      res.status(201).json({
        status: "success",
        message: "Announcement created successfully",
        data: { announcement },
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
      const announcements = await announcementService.getAllAnnouncements();
      res.status(200).json({
        status: "success",
        data: { announcements },
      });
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
      const announcement = await announcementService.getAnnouncementById(
        req.params.id,
      );
      res.status(200).json({
        status: "success",
        data: { announcement },
      });
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
      await announcementService.deleteAnnouncement(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Announcement deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
