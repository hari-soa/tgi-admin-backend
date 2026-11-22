import { Request, Response } from "express";
import { LoginDto } from "../dtos/authDto";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { catchAsync } from "../utils/catchAsync";

export const authController = {
  login: catchAsync(
    async (
      req: Request<unknown, unknown, LoginDto>,
      res: Response,
    ): Promise<void> => {
      const result = await authService.login(req.body);
      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: result,
      });
    },
  ),

  getAuthenticatedUser: catchAsync(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const user = await userService.getUserProfile(
        req.user!.userId,
        req.user!,
      );
      res.status(200).json({ status: "success", data: { user } });
    },
  ),
};
