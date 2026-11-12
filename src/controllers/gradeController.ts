import { Request, Response, NextFunction } from "express";
import { gradeService } from "../services/gradeService";

export const gradeController = {
  create: async (
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const secretaryId = req.user!.userId;
      const grade = await gradeService.createGrade(req.body, secretaryId);
      res.status(201).json({
        status: "success",
        message: "Grade created successfully as draft",
        data: { grade },
      });
    } catch (error) {
      next(error);
    }
  },

  submitSession: async (
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const secretaryId = req.user!.userId;
      const grades = await gradeService.submitSession(req.body, secretaryId);
      res.status(201).json({
        status: "success",
        message: "Grade session submitted successfully (pending admin review)",
        data: { grades },
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
      const grades = await gradeService.getAllGrades();
      res.status(200).json({ status: "success", data: { grades } });
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
      const grade = await gradeService.getGradeById(req.params.id);
      res.status(200).json({ status: "success", data: { grade } });
    } catch (error) {
      next(error);
    }
  },

  update: async (
    req: Request<{ id: string }, {}, any>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const grade = await gradeService.updateGrade(req.params.id, req.body);
      res.status(200).json({
        status: "success",
        message: "Grade updated successfully",
        data: { grade },
      });
    } catch (error) {
      next(error);
    }
  },

  review: async (
    req: Request<{ id: string }, {}, { status: string }> & {
      user?: { userId: string };
    },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const { status } = req.body;
      const grade = await gradeService.reviewGrade(
        req.params.id,
        status,
        adminId,
      );
      res.status(200).json({
        status: "success",
        message: "Grade status updated successfully",
        data: { grade },
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
      const result = await gradeService.deleteGrade(req.params.id);
      res.status(200).json({ status: "success", ...result });
    } catch (error) {
      next(error);
    }
  },
};
