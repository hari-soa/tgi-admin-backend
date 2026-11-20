import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

const POSTGRES_UNIQUE_VIOLATION = "23505";
const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";
const POSTGRES_INVALID_TEXT_REPRESENTATION = "22P02";

const getPostgresErrorResponse = (
  error: unknown,
): { statusCode: number; message: string } | null => {
  const code = (error as { code?: string }).code;

  if (code === POSTGRES_UNIQUE_VIOLATION) {
    return {
      statusCode: 400,
      message: "A record with the same unique value already exists",
    };
  }
  if (code === POSTGRES_FOREIGN_KEY_VIOLATION) {
    return {
      statusCode: 400,
      message: "A referenced record does not exist or is still in use",
    };
  }
  if (code === POSTGRES_INVALID_TEXT_REPRESENTATION) {
    return { statusCode: 400, message: "Invalid identifier or value format" };
  }
  return null;
};

export const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      status: "fail",
      message: "Validation error",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
    return;
  }

  const postgresResponse = getPostgresErrorResponse(err);
  if (postgresResponse) {
    res
      .status(postgresResponse.statusCode)
      .json({ status: "fail", message: postgresResponse.message });
    return;
  }

  console.error("ERROR :", err);
  res.status(500).json({
    status: "error",
    message: "Something went very wrong on the server",
  });
};
