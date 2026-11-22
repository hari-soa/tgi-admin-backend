const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const SPEC_FILE = path.join(__dirname, "../docs/openAPI.yml");
const CONTROLLERS_DIRECTORY = path.join(__dirname, "../src/controllers");
const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const HANDLER_PATTERN = /^ {2}(\w+): catchAsync/gm;

const specification = yaml.load(fs.readFileSync(SPEC_FILE, "utf8"));

const specOperations = Object.entries(specification.paths).flatMap(
  ([route, pathItem]) =>
    HTTP_METHODS.filter((method) => pathItem[method]).map((method) => ({
      label: `${method.toUpperCase()} ${route}`,
      operationId: pathItem[method].operationId,
      secured: pathItem[method].security?.length !== 0,
      roles: pathItem[method]["x-roles"],
    })),
);

const controllerHandlers = fs
  .readdirSync(CONTROLLERS_DIRECTORY)
  .filter((fileName) => fileName.endsWith("Controller.ts"))
  .flatMap((fileName) => {
    const source = fs.readFileSync(
      path.join(CONTROLLERS_DIRECTORY, fileName),
      "utf8",
    );
    return [...source.matchAll(HANDLER_PATTERN)].map((match) => match[1]);
  });

const missingOperationId = specOperations.filter(
  (operation) => !operation.operationId,
);
const securedWithoutRoles = specOperations.filter(
  (operation) => operation.secured && !operation.roles?.length,
);
const operationIds = specOperations.map((operation) => operation.operationId);
const duplicatedIds = operationIds.filter(
  (id, index) => operationIds.indexOf(id) !== index,
);
const withoutHandler = specOperations.filter(
  (operation) => !controllerHandlers.includes(operation.operationId),
);
const withoutOperation = controllerHandlers.filter(
  (handler) => !operationIds.includes(handler),
);

const problems = [
  ...missingOperationId.map((operation) => `${operation.label}: missing operationId`),
  ...securedWithoutRoles.map((operation) => `${operation.label}: missing x-roles`),
  ...duplicatedIds.map((id) => `${id}: duplicated operationId`),
  ...withoutHandler.map(
    (operation) => `${operation.label}: no controller handler named ${operation.operationId}`,
  ),
  ...withoutOperation.map((handler) => `${handler}: controller handler without operation in the spec`),
];

if (problems.length > 0) {
  console.error("OpenAPI specification and controllers are out of sync:");
  problems.forEach((problem) => console.error(` - ${problem}`));
  process.exit(1);
}

console.log(`OK: ${specOperations.length} operations are routed from the specification.`);
