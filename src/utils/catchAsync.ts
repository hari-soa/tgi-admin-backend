import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandler<TRequest extends Request> = (
  req: TRequest,
  res: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * Wraps an async controller so that any rejection is forwarded to the
 * global error handler. The request type stays specific at the call site.
 */
export const catchAsync = <TRequest extends Request = Request>(
  handler: AsyncHandler<TRequest>,
): RequestHandler => {
  return (req, res, next) => {
    handler(req as TRequest, res, next).catch(next);
  };
};
