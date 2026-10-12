import { Request, Response, NextFunction } from "express";
import { LoginDto } from "../dtos";
import { AppError } from "../utils/AppError";
// Importer ton AuthService dès qu'il sera implémenté :
// import { authService } from "../services/authService";

export class AuthController {
  public static async login(
    req: Request<{}, {}, LoginDto>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, matricule } = req.body;
      res.status(200).json({
        status: "success",
        message: "Login successful",
      });
    } catch (error) {
      next(error);
    }
  }
}
