import { Request, Response, NextFunction } from "express";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
} from "../dtos";
import { UserService } from "../services/userService";

export class UserController {
  public static async createAdministrator(
    req: Request<{}, {}, CreateAdministratorDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await UserService.createAdministrator(req.body);
      res.status(201).json({
        status: "success",
        message: "Administrator created successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createStudent(
    req: Request<{}, {}, CreateStudentDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await UserService.createStudent(req.body);
      res.status(201).json({
        status: "success",
        message: "Student created successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createSecretary(
    req: Request<{}, {}, CreateSecretaryDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await UserService.createSecretary(req.body);
      res.status(201).json({
        status: "success",
        message: "Secretary created successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}
