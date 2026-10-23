import { Request, Response, NextFunction } from "express";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
} from "../dtos/userDto";
import { userService } from "../services/userService";

export const userController = {
  createAdministrator: async (
    req: Request<{}, {}, CreateAdministratorDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.createAdministrator(req.body);
      res.status(201).json({
        status: "success",
        message: "Administrator created successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  createStudent: async (
    req: Request<{}, {}, CreateStudentDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.createStudent(req.body);
      res.status(201).json({
        status: "success",
        message: "Student created successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  createSecretary: async (
    req: Request<{}, {}, CreateSecretaryDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.createSecretary(req.body);
      res.status(201).json({
        status: "success",
        message: "Secretary created successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  getMyProfile: async (
    req: Request & { user?: { userId: string; role: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const requester = req.user!;
      const user = await userService.getUserProfile(
        requester.userId,
        requester,
      );
      res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  updateUser: async (
    req: Request<{ id: string }, {}, any> & { user?: { role: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const targetId = req.params.id;
      const requesterRole = req.user!.role;
      const updatedUser = await userService.updateUser(
        targetId,
        req.body,
        requesterRole,
      );

      res.status(200).json({
        status: "success",
        message: "User updated successfully",
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  },

  deactivateStudent: async (
    req: Request<{ id: string }> & { user?: { role: string } },
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const targetId = req.params.id;
      await userService.deactivateStudent(targetId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
