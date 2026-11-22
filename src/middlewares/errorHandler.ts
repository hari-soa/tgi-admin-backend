import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../utils/AppError";

const POSTGRES_UNIQUE_VIOLATION = "23505";
const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";
const POSTGRES_INVALID_TEXT_REPRESENTATION = "22P02";
const BAD_REQUEST = 400;
const FIRST_SERVER_ERROR = 500;
const REQUEST_LOCATION_PREFIX = /^[./]?(body|query|params)[./]?/;

interface SpecificationError {
  status: number;
  message: string;
  errors?: { path?: string; message?: string }[];
}

const isSpecificationError = (error: unknown): error is SpecificationError =>
  typeof error === "object" &&
  error !== null &&
  typeof (error as { status?: unknown }).status === "number";

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

const toFieldErrors = (error: SpecificationError) =>
  (error.errors ?? []).map((issue) => ({
    field: (issue.path ?? "")
      .replace(REQUEST_LOCATION_PREFIX, "")
      .replaceAll("/", "."),
    message: issue.message ?? "Invalid value",
  }));

export const globalErrorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
    return;
  }

  if (isSpecificationError(err)) {
    const isInvalidInput = err.status === BAD_REQUEST;
    res.status(err.status).json({
      status: err.status < FIRST_SERVER_ERROR ? "fail" : "error",
      message: isInvalidInput ? "Invalid input data" : err.message,
      ...(isInvalidInput ? { errors: toFieldErrors(err) } : {}),
    });
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
