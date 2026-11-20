import { Request, Response } from "express";
import { subjectService } from "../services/subjectService";
import { catchAsync } from "../utils/catchAsync";
import { CreateSubjectDto, UpdateSubjectDto } from "../dtos/subjectDto";

type IdParams = { id: string };

export const subjectController = {
  create: catchAsync(
    async (
      req: Request<unknown, unknown, CreateSubjectDto>,
      res: Response,
    ): Promise<void> => {
      const subject = await subjectService.createSubject(req.body);
      res.status(201).json({
        status: "success",
        message: "Subject created successfully",
        data: { subject },
      });
    },
  ),

  update: catchAsync(
    async (
      req: Request<IdParams, unknown, UpdateSubjectDto>,
      res: Response,
    ): Promise<void> => {
      const subject = await subjectService.updateSubject(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Subject updated successfully",
        data: { subject },
      });
    },
  ),

  getAll: catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const subjects = await subjectService.getAllSubjects();
    res.status(200).json({
      status: "success",
      results: subjects.length,
      data: { subjects },
    });
  }),

  getById: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      const subject = await subjectService.getSubjectById(req.params.id);
      res.status(200).json({ status: "success", data: { subject } });
    },
  ),

  delete: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      await subjectService.deleteSubject(req.params.id);
      res.status(204).send();
    },
  ),
};
