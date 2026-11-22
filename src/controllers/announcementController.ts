import { Request, Response } from "express";
import { announcementService } from "../services/announcementService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "../dtos/announcementDto";

type IdParams = { id: string };

export const announcementController = {
  createAnnouncement: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateAnnouncementDto>,
      res: Response,
    ): Promise<void> => {
      const announcement = await announcementService.createAnnouncement(
        req.body,
        req.user!.userId,
      );
      res.status(201).json({
        status: "success",
        message: "Announcement created successfully",
        data: { announcement },
      });
    },
  ),

  listAnnouncements: catchAsync(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const announcements = await announcementService.getAllAnnouncements(
        req.user!,
      );
      res.status(200).json({
        status: "success",
        results: announcements.length,
        data: { announcements },
      });
    },
  ),

  getAnnouncementById: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams>,
      res: Response,
    ): Promise<void> => {
      const announcement = await announcementService.getAnnouncementById(
        req.params.id,
        req.user!,
      );
      res.status(200).json({ status: "success", data: { announcement } });
    },
  ),

  updateAnnouncement: catchAsync(
    async (
      req: Request<IdParams, unknown, UpdateAnnouncementDto>,
      res: Response,
    ): Promise<void> => {
      const announcement = await announcementService.updateAnnouncement(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Announcement updated successfully",
        data: { announcement },
      });
    },
  ),

  deleteAnnouncement: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      await announcementService.deleteAnnouncement(req.params.id);
      res.status(204).send();
    },
  ),
};
