import { Request, Response, NextFunction } from "express";
import { LoginDto } from "../dtos/authDto";
import { AuthService } from "../services/authService";

export class AuthController {
  public static async login(
    req: Request<{}, {}, LoginDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AuthService.login(req.body);

      res.status(200).json({
        status: "success",
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
