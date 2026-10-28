import { Request, Response, NextFunction } from "express";
import { LoginDto } from "../dtos/authDto";
import { authService } from "../services/authService";
import { userRepository } from "../repositories/userRepository";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const authController = {
  login: async (
    req: Request<{}, {}, LoginDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await authService.login(req.body);

      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const user = await userRepository.findById(userId!);

      if (!user) {
        throw new AppError("User not found", 404);
      }

      res.status(200).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};
