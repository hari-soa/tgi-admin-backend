import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "fail",
          message: "Invalid input data",
          errors: error.issues.map((issue) => ({
            field: issue.path.join(".").replace("body.", ""),
            message: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
