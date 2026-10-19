import { Request, Response, NextFunction } from "express";
import { resultService } from "../services/resultService";

export const resultController = {
  create: async (
    req: Request<{}, {}, any> & { user?: { userId: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const secretaryId = req.user!.userId;
      const result = await resultService.createResult(req.body, secretaryId);
      res.status(201).json({
        status: "success",
        message: "Annual result/bulletin created successfully",
        data: { result },
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
      const result = await resultService.getResultById(req.params.id);
      res.status(200).json({
        status: "success",
        data: { result },
      });
    } catch (error) {
      next(error);
    }
  },

  review: async (
    req: Request<{ id: string }, {}, { status: string; decision: string }> & {
      user?: { userId: string };
    },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const adminId = req.user!.userId;
      const { status, decision } = req.body;
      const updated = await resultService.reviewResult(
        req.params.id,
        status,
        decision,
        adminId,
      );
      res.status(200).json({
        status: "success",
        message: "Annual result reviewed and updated successfully",
        data: { result: updated },
      });
    } catch (error) {
      next(error);
    }
  },

  getByStudent: async (
    req: Request<{ studentId: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const results = await resultService.getStudentHistory(
        req.params.studentId,
      );
      res.status(200).json({
        status: "success",
        data: { results },
      });
    } catch (error) {
      next(error);
    }
  },
};
