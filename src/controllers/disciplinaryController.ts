import { Request, Response, NextFunction } from "express";
import { disciplinaryService } from "../services/disciplinaryService";

export const disciplinaryController = {
  createHistoryRecord: async (
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const record = await disciplinaryService.addHistoryRecord(
        req.body,
        adminId,
      );

      res.status(201).json({
        status: "success",
        message: "Student history record created successfully",
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  },

  updateHistoryRecord: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const record = await disciplinaryService.updateHistoryRecord(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Student history record updated successfully",
        data: { record },
      });
    } catch (error) {
      next(error);
    }
  },

  deleteHistoryRecord: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await disciplinaryService.deleteHistoryRecord(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Student history record deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  createRemark: async (
    req: Request<{}, {}, any> & { user?: { userId: string; role: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authorId = req.user!.userId;
      const authorRole = req.user!.role;
      const remark = await disciplinaryService.addRemark(
        req.body,
        authorId,
        authorRole,
      );

      res.status(201).json({
        status: "success",
        message: "Student remark added successfully",
        data: { remark },
      });
    } catch (error) {
      next(error);
    }
  },

  updateRemark: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const remark = await disciplinaryService.updateRemark(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Student remark updated successfully",
        data: { remark },
      });
    } catch (error) {
      next(error);
    }
  },

  deleteRemark: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await disciplinaryService.deleteRemark(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Student remark deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
