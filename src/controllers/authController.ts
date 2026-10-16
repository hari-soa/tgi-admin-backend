import { Request, Response, NextFunction } from "express";
import { LoginDto } from "../dtos/authDto";
import { authService } from "../services/authService";

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
};
