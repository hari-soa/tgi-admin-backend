import { Request, Response, NextFunction } from "express";
import { GradeService } from "../services/gradeService";

export class GradeController {
  public static async transcribe(
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const secretaryId = req.user!.userId;
      const grade = await GradeService.transcribeGrade(req.body, secretaryId);
      res.status(201).json({
        status: "success",
        message: "Grade transcribed successfully (pending approval)",
        data: { grade },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createAnnualResult(
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const secretaryId = req.user!.userId;
      const result = await GradeService.submitAnnualResult(
        req.body,
        secretaryId,
      );
      res.status(201).json({
        status: "success",
        message: "Annual result created successfully",
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async reviewResult(
    req: Request<{ id: string }, {}, { status: any; decision: any }> & {
      user?: { userId: string };
    },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const { status, decision } = req.body;
      const result = await GradeService.reviewAnnualResult(
        req.params.id,
        status,
        decision,
        adminId,
      );
      res.status(200).json({
        status: "success",
        message: "Annual result status and decision updated successfully",
        data: { result },
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
      const result = await GradeService.getResultById(req.params.id);
      res.status(200).json({ status: "success", data: { result } });
    } catch (error) {
      next(error);
    }
  }
}
