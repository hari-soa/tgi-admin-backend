import { Request, Response, NextFunction } from "express";
import { SubjectService } from "../services/subjectService";

export class SubjectController {
  public static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const subject = await SubjectService.createSubject(req.body);
      res.status(201).json({
        status: "success",
        message: "Subject created successfully",
        data: { subject },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const subjects = await SubjectService.getAllSubjects();
      res.status(200).json({ status: "success", data: { subjects } });
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
      const subject = await SubjectService.getSubjectById(req.params.id);
      res.status(200).json({ status: "success", data: { subject } });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await SubjectService.deleteSubject(req.params.id);
      res
        .status(200)
        .json({ status: "success", message: "Subject deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
