import { Request, Response } from "express";
import { gradeService } from "../services/gradeService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";
import {
  CreateGradeDto,
  CreateGradeSessionDto,
  ReviewGradeDto,
  ReviseGradeSessionDto,
  SaveGradeSessionDto,
  UpdateGradeDto,
} from "../dtos/gradeDto";

type IdParams = { id: string };

export const gradeController = {
  createGrade: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateGradeDto>,
      res: Response,
    ): Promise<void> => {
      const grade = await gradeService.createGrade(req.body, req.user!.userId);
      res.status(201).json({
        status: "success",
        message: "Grade created successfully as draft",
        data: { grade },
      });
    },
  ),

  listGrades: catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const grades = await gradeService.getAllGrades();
    res.status(200).json({
      status: "success",
      results: grades.length,
      data: { grades },
    });
  }),

  getGradeById: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      const grade = await gradeService.getGradeById(req.params.id);
      res.status(200).json({ status: "success", data: { grade } });
    },
  ),

  updateGrade: catchAsync(
    async (
      req: Request<IdParams, unknown, UpdateGradeDto>,
      res: Response,
    ): Promise<void> => {
      const grade = await gradeService.updateGrade(req.params.id, req.body);
      res.status(200).json({
        status: "success",
        message: "Grade updated successfully",
        data: { grade },
      });
    },
  ),

  reviewGrade: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams, ReviewGradeDto>,
      res: Response,
    ): Promise<void> => {
      const grade = await gradeService.reviewGrade(
        req.params.id,
        req.body.status,
        req.user!.userId,
      );
      res.status(200).json({
        status: "success",
        message: `Grade status updated to ${req.body.status}`,
        data: { grade },
      });
    },
  ),

  deleteGrade: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      await gradeService.deleteGrade(req.params.id);
      res.status(204).send();
    },
  ),

  createGradeSession: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateGradeSessionDto>,
      res: Response,
    ): Promise<void> => {
      const session = await gradeService.createSession(
        req.body,
        req.user!.userId,
      );
      res.status(201).json({
        status: "success",
        message: "Grade session created successfully",
        data: { session },
      });
    },
  ),

  listGradeSessions: catchAsync(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const sessions = await gradeService.getSessions(req.user!.role);
      res.status(200).json({
        status: "success",
        results: sessions.length,
        data: { sessions },
      });
    },
  ),

  saveGradeSessionDraft: catchAsync(
    async (
      req: Request<IdParams, unknown, SaveGradeSessionDto>,
      res: Response,
    ): Promise<void> => {
      const session = await gradeService.saveSessionDraft(
        req.params.id,
        req.body.grades,
      );
      res.status(200).json({
        status: "success",
        message: "Draft saved successfully",
        data: { session },
      });
    },
  ),

  submitGradeSession: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams, SaveGradeSessionDto>,
      res: Response,
    ): Promise<void> => {
      const session = await gradeService.submitSession(
        req.params.id,
        req.body.grades,
        req.user!.userId,
      );
      res.status(200).json({
        status: "success",
        message: "Grade session submitted successfully (pending admin review)",
        data: { session },
      });
    },
  ),

  validateGradeSession: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams>,
      res: Response,
    ): Promise<void> => {
      const session = await gradeService.validateSession(
        req.params.id,
        req.user!.userId,
      );
      res.status(200).json({
        status: "success",
        message: "Grade session validated and published to the report cards",
        data: { session },
      });
    },
  ),

  reviseGradeSession: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams, ReviseGradeSessionDto>,
      res: Response,
    ): Promise<void> => {
      const session = await gradeService.reviseSession(
        req.params.id,
        req.body.grades,
        req.body.absences,
      );
      res.status(200).json({
        status: "success",
        message: "Submitted grades corrected successfully",
        data: { session },
      });
    },
  ),
};
