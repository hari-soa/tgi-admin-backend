import { Request, Response, NextFunction } from "express";
import { subjectService } from "../services/subjectService";
import { UpdateSubjectDto } from "../dtos/subjectDto";

export const subjectController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const subject = await subjectService.createSubject(req.body);
      res.status(201).json({
        status: "success",
        message: "Subject created successfully",
        data: { subject },
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (
    req: Request<{ id: string }, {}, UpdateSubjectDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const subject = await subjectService.updateSubject(
        req.params.id,
        req.body,
      );
      res.status(200).json({
        status: "success",
        message: "Subject updated successfully",
        data: { subject },
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
      const subjects = await subjectService.getAllSubjects();
      res.status(200).json({ status: "success", data: { subjects } });
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
      const subject = await subjectService.getSubjectById(req.params.id);
      res.status(200).json({ status: "success", data: { subject } });
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
      await subjectService.deleteSubject(req.params.id);
      res
        .status(200)
        .json({ status: "success", message: "Subject deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};
