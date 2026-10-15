import { Request, Response, NextFunction } from "express";
import { AnnouncementService } from "../services/announcementService";

export class AnnouncementController {
  public static async create(
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authorId = req.user!.userId;
      const { targetClasses, ...dto } = req.body;
      const announcement = await AnnouncementService.createAnnouncement(
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
  }

  public static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const announcements = await AnnouncementService.getAllAnnouncements();
      res.status(200).json({
        status: "success",
        data: { announcements },
      });
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
      const announcement = await AnnouncementService.getAnnouncementById(
        req.params.id,
      );
      res.status(200).json({
        status: "success",
        data: { announcement },
      });
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
      await AnnouncementService.deleteAnnouncement(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Announcement deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
