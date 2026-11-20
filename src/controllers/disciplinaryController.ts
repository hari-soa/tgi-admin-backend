import { Request, Response } from "express";
import { disciplinaryService } from "../services/disciplinaryService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";
import {
  CreateStudentHistoryRecordDto,
  UpdateStudentHistoryRecordDto,
} from "../dtos/studentHistoryDto";
import {
  CreateStudentRemarkDto,
  UpdateStudentRemarkDto,
} from "../dtos/studentRemarkDto";

type IdParams = { id: string };
type StudentParams = { studentId: string };

export const disciplinaryController = {
  createHistoryRecord: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateStudentHistoryRecordDto>,
      res: Response,
    ): Promise<void> => {
      const record = await disciplinaryService.addHistoryRecord(
        req.body,
        req.user!.userId,
      );
      res.status(201).json({
        status: "success",
        message: "History record added successfully",
        data: { record },
      });
    },
  ),

  getStudentHistory: catchAsync(
    async (
      req: AuthenticatedRequest<StudentParams>,
      res: Response,
    ): Promise<void> => {
      const records = await disciplinaryService.getStudentHistory(
        req.params.studentId,
        req.user!,
      );
      res.status(200).json({
        status: "success",
        results: records.length,
        data: { records },
      });
    },
  ),

  updateHistoryRecord: catchAsync(
    async (
      req: Request<IdParams, unknown, UpdateStudentHistoryRecordDto>,
      res: Response,
    ): Promise<void> => {
      const record = await disciplinaryService.updateHistoryRecord(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "History record updated successfully",
        data: { record },
      });
    },
  ),

  deleteHistoryRecord: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      await disciplinaryService.deleteHistoryRecord(req.params.id);
      res.status(204).send();
    },
  ),

  createRemark: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateStudentRemarkDto>,
      res: Response,
    ): Promise<void> => {
      const remark = await disciplinaryService.addRemark(
        req.body,
        req.user!.userId,
        req.user!.role,
      );
      res.status(201).json({
        status: "success",
        message: "Remark added successfully",
        data: { remark },
      });
    },
  ),

  getStudentRemarks: catchAsync(
    async (
      req: AuthenticatedRequest<StudentParams>,
      res: Response,
    ): Promise<void> => {
      const remarks = await disciplinaryService.getStudentRemarks(
        req.params.studentId,
        req.user!,
      );
      res.status(200).json({
        status: "success",
        results: remarks.length,
        data: { remarks },
      });
    },
  ),

  updateRemark: catchAsync(
    async (
      req: Request<IdParams, unknown, UpdateStudentRemarkDto>,
      res: Response,
    ): Promise<void> => {
      const remark = await disciplinaryService.updateRemark(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Remark updated successfully",
        data: { remark },
      });
    },
  ),

  deleteRemark: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      await disciplinaryService.deleteRemark(req.params.id);
      res.status(204).send();
    },
  ),
};
