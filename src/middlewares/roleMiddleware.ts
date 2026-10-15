import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    if (!user || !allowedRoles.includes(user.userType || user.role)) {
      return next(new AppError("Forbidden: Access denied", 403));
    }

    next();
  };
};
