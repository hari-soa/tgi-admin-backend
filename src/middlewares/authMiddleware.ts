import { Request } from "express";
import { SecurityHandlers } from "express-openapi-validator/dist/framework/types";
import { verifyToken, TokenPayload } from "../utils/jwt";

export interface AuthenticatedRequest<
  TParams = Request["params"],
  TBody = unknown,
> extends Request<TParams, unknown, TBody> {
  user?: TokenPayload;
}

type OperationMetadata = { schema?: { "x-roles"?: string[] } };

const rejectWith = (message: string, status: number): Error =>
  Object.assign(new Error(message), { status });

const readBearerToken = (request: Request): string => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw rejectWith("Authentication required. Please log in.", 401);
  }
  return authHeader.split(" ")[1];
};

const verifyBearerToken = (token: string): TokenPayload => {
  try {
    return verifyToken(token);
  } catch {
    throw rejectWith("Invalid or expired token.", 401);
  }
};

export const authenticateWithSpecification: SecurityHandlers[string] = async (
  request,
) => {
  const user = verifyBearerToken(readBearerToken(request));
  const allowedRoles = (request as Request & { openapi?: OperationMetadata })
    .openapi?.schema?.["x-roles"];

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw rejectWith(
      "You do not have permission to perform this action.",
      403,
    );
  }

  (request as AuthenticatedRequest).user = user;
  return true;
};
