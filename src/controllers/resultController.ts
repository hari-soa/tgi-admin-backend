import { Response } from "express";
import { resultService } from "../services/resultService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";
import {
  CreateAnnualResultDto,
  UpdateAnnualResultDto,
} from "../dtos/resultDto";

type IdParams = { id: string };
type StudentParams = { studentId: string };

export const resultController = {
  create: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateAnnualResultDto>,
      res: Response,
    ): Promise<void> => {
      const result = await resultService.createResult(
        req.body,
        req.user!.userId,
      );
      res.status(201).json({
        status: "success",
        message: "Annual result created successfully",
        data: { result },
      });
    },
  ),

  getById: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams>,
      res: Response,
    ): Promise<void> => {
      const result = await resultService.getResultById(
        req.params.id,
        req.user!,
      );
      res.status(200).json({ status: "success", data: { result } });
    },
  ),

  review: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams, UpdateAnnualResultDto>,
      res: Response,
    ): Promise<void> => {
      const result = await resultService.reviewResult(
        req.params.id,
        req.body.status,
        req.body.decision,
        req.user!.userId,
      );
      res.status(200).json({
        status: "success",
        message: "Annual result reviewed and updated successfully",
        data: { result },
      });
    },
  ),

  getByStudent: catchAsync(
    async (
      req: AuthenticatedRequest<StudentParams>,
      res: Response,
    ): Promise<void> => {
      const results = await resultService.getStudentResults(
        req.params.studentId,
        req.user!,
      );
      res.status(200).json({
        status: "success",
        results: results.length,
        data: { results },
      });
    },
  ),

  exportPdf: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams>,
      res: Response,
    ): Promise<void> => {
      const { pdfUrl } = await resultService.generateAndExportPdf(
        req.params.id,
        req.user!,
      );
      res.status(200).json({
        status: "success",
        message: "Report card PDF generated successfully",
        data: { pdfUrl },
      });
    },
  ),
};
