import path from "path";
import { OperationHandlerOptions } from "express-openapi-validator/dist/framework/types";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { OpenApiValidatorOpts } from "express-openapi-validator/dist/openapi.validator";
import * as OpenApiValidator from "express-openapi-validator";
import { authenticateWithSpecification } from "./authMiddleware";
import { operationHandlers } from "../utils/operationRegistry";
import { specification } from "../utils/specification";

const CONTROLLERS_DIRECTORY = path.join(__dirname, "../controllers");

const resolveOperationHandler: OperationHandlerOptions["resolver"] = (
  _controllersPath,
  route,
  apiDoc,
) => {
  const pathKey = route.openApiRoute.substring(route.basePath.length);
  const operation = (apiDoc.paths?.[pathKey] as Record<string, OpenAPIV3.OperationObject>)[
    route.method.toLowerCase()
  ];
  const operationId = operation.operationId ?? "";
  const handler = operationHandlers[operationId];

  if (!handler) {
    throw new Error(`No controller handles the operation "${operationId}"`);
  }
  return handler;
};

export const createSpecificationMiddleware = () =>
  OpenApiValidator.middleware({
    apiSpec: specification as unknown as OpenApiValidatorOpts["apiSpec"],
    validateApiSpec: true,
    validateRequests: {
      removeAdditional: true,
      allowUnknownQueryParameters: false,
      coerceTypes: true,
    },
    validateResponses: false,
    validateSecurity: {
      handlers: { bearerAuth: authenticateWithSpecification },
    },
    operationHandlers: {
      basePath: CONTROLLERS_DIRECTORY,
      resolver: resolveOperationHandler,
    },
  });
