import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

/**
 * Validates body, query and params with a zod schema shaped as
 * { body?, query?, params? }. The parsed body (defaults applied, strings
 * trimmed, dates coerced) replaces req.body for the controllers.
 */
export const validate = (schema: ZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: unknown };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: "fail",
          message: "Invalid input data",
          errors: error.issues.map((issue) => ({
            field: issue.path.filter((segment) => segment !== "body").join("."),
            message: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
