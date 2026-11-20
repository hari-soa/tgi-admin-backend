import { Request, Response } from "express";
import { gradeService } from "../services/gradeService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";
import {
  CreateGradeDto,
  CreateGradeSessionDto,
  SessionGradeDto,
  UpdateGradeDto,
} from "../dtos/gradeDto";

type IdParams = { id: string };
type SessionGradesBody = { grades: SessionGradeDto[] };

export const gradeController = {
  create: catchAsync(
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

  getAll: catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const grades = await gradeService.getAllGrades();
    res.status(200).json({
      status: "success",
      results: grades.length,
      data: { grades },
    });
  }),

  getById: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      const grade = await gradeService.getGradeById(req.params.id);
      res.status(200).json({ status: "success", data: { grade } });
    },
  ),

  update: catchAsync(
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

  review: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams, { status: string }>,
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

  delete: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      await gradeService.deleteGrade(req.params.id);
      res.status(204).send();
    },
  ),

  createSession: catchAsync(
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

  getSessions: catchAsync(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const sessions = await gradeService.getSessions(req.user!.role);
      res.status(200).json({
        status: "success",
        results: sessions.length,
        data: { sessions },
      });
    },
  ),

  saveSessionDraft: catchAsync(
    async (
      req: Request<IdParams, unknown, SessionGradesBody>,
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

  submitSession: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams, SessionGradesBody>,
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

  validateSession: catchAsync(
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
};
