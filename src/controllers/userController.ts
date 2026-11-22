import { Response } from "express";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
  CreateTeacherDto,
  UpdateUserDto,
  UserRole,
} from "../dtos/userDto";
import { userService } from "../services/userService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";

type IdParams = { id: string };

const sendCreatedUser = (res: Response, message: string, user: unknown): void => {
  res.status(201).json({ status: "success", message, data: { user } });
};

export const userController = {
  listUsers: catchAsync(
    async (
      req: AuthenticatedRequest,
      res: Response,
    ): Promise<void> => {
      const users = await userService.getAllUsers(
        req.query as { role?: UserRole; classGroup?: string; search?: string },
        req.user!,
      );
      res.status(200).json({
        status: "success",
        results: users.length,
        data: { users },
      });
    },
  ),

  listStaff: catchAsync(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const users = await userService.getStaff(req.user!);
      res.status(200).json({
        status: "success",
        results: users.length,
        data: { users },
      });
    },
  ),

  createAdministrator: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateAdministratorDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createAdministrator(req.body);
      sendCreatedUser(res, "Administrator created successfully", user);
    },
  ),

  createStudent: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateStudentDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createStudent(req.body);
      sendCreatedUser(res, "Student created successfully", user);
    },
  ),

  createSecretary: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateSecretaryDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createSecretary(req.body);
      sendCreatedUser(res, "Secretary created successfully", user);
    },
  ),

  createTeacher: catchAsync(
    async (
      req: AuthenticatedRequest<unknown, CreateTeacherDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.createTeacher(req.body);
      sendCreatedUser(res, "Teacher created successfully", user);
    },
  ),

  getUserById: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.getUserById(req.params.id, req.user!);
      res.status(200).json({ status: "success", data: { user } });
    },
  ),

  getMyProfile: catchAsync(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = await userService.getUserProfile(
        req.user!.userId,
        req.user!,
      );
      res.status(200).json({ status: "success", data: { user } });
    },
  ),

  updateUser: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams, UpdateUserDto>,
      res: Response,
    ): Promise<void> => {
      const user = await userService.updateUser(
        req.params.id,
        req.body,
        req.user!,
      );
      res.status(200).json({
        status: "success",
        message: "User updated successfully",
        data: { user },
      });
    },
  ),

  deactivateStudent: catchAsync(
    async (
      req: AuthenticatedRequest<IdParams>,
      res: Response,
    ): Promise<void> => {
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
