import { Request, Response } from "express";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
  CreateTeacherDto,
} from "../dtos/userDto";
import { userService } from "../services/userService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { UserRole } from "../models/userModel";
import { catchAsync } from "../utils/catchAsync";

type IdParams = { id: string };
type ListUsersQuery = { role?: UserRole; classGroup?: string; search?: string };

export const userController = {
  getAllUsers: catchAsync(
    async (
      req: Request<unknown, unknown, unknown, ListUsersQuery>,
      res: Response,
    ): Promise<void> => {
      const users = await userService.getAllUsers(req.query);
      res.status(200).json({
        status: "success",
        results: users.length,
        data: { users },
      });
    },
  ),

  getStaff: catchAsync(async (_req: Request, res: Response): Promise<void> => {
    const users = await userService.getStaff();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  }),

  createAdministrator: catchAsync(
    async (
      req: Request<unknown, unknown, CreateAdministratorDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createAdministrator(req.body);
      res.status(201).json({
        status: "success",
        message: "Administrator created successfully",
        data: { user },
      });
    },
  ),

  createStudent: catchAsync(
    async (
      req: Request<unknown, unknown, CreateStudentDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createStudent(req.body);
      res.status(201).json({
        status: "success",
        message: "Student created successfully",
        data: { user },
      });
    },
  ),

  createSecretary: catchAsync(
    async (
      req: Request<unknown, unknown, CreateSecretaryDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createSecretary(req.body);
      res.status(201).json({
        status: "success",
        message: "Secretary created successfully",
        data: { user },
      });
    },
  ),

  createTeacher: catchAsync(
    async (
      req: Request<unknown, unknown, CreateTeacherDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createTeacher(req.body);
      res.status(201).json({
        status: "success",
        message: "Teacher created successfully",
        data: { user },
      });
    },
  ),

  getUserById: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({ status: "success", data: { user } });
    },
  ),

  getMyProfile: catchAsync(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const requester = req.user!;
      const user = await userService.getUserProfile(
        requester.userId,
        requester,
      );
      res.status(200).json({ status: "success", data: { user } });
    },
  ),

  updateUser: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({
        status: "success",
        message: "User updated successfully",
        data: { user },
      });
    },
  ),

  deactivateStudent: catchAsync(
    async (req: Request<IdParams>, res: Response): Promise<void> => {
      await userService.deactivateStudent(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Student account deactivated successfully",
      });
    },
  ),

  deleteUser: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams>,
      res: Response,
    ): Promise<void> => {
      await userService.deleteUser(req.params.id, req.user!.userId);
      res.status(204).send();
    },
  ),
};
