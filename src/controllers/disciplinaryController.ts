import { Request, Response, NextFunction } from "express";
import { DisciplinaryService } from "../services/disciplinaryService";

export class DisciplinaryController {
  public static async createHistoryRecord(
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const record = await DisciplinaryService.addHistoryRecord(
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
  }

  public static async updateHistoryRecord(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const record = await DisciplinaryService.updateHistoryRecord(
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
  }

  public static async deleteHistoryRecord(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await DisciplinaryService.deleteHistoryRecord(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Student history record deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createRemark(
    req: Request<{}, {}, any> & { user?: { userId: string; role: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authorId = req.user!.userId;
      const authorRole = req.user!.role;
      const remark = await DisciplinaryService.addRemark(
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
  }

  public static async updateRemark(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const remark = await DisciplinaryService.updateRemark(
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
  }

  public static async deleteRemark(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await DisciplinaryService.deleteRemark(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Student remark deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
