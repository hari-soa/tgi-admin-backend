/**
 * Fails when the routes declared in src/routes and the operations described in
 * docs/openAPI.yml are not exactly the same. Run with: npm run check:spec
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const ROUTE_FILE_BY_PREFIX = {
  auth: "authRoutes",
  users: "userRoutes",
  subjects: "subjectRoutes",
  announcements: "announcementRoutes",
  disciplinary: "disciplinaryRoutes",
  attendance: "teacherAttendanceRoutes",
  grades: "gradeRoutes",
  results: "resultRoutes",
};

const normalizePath = (routePath) =>
  routePath.replace(/\{\w+\}/g, ":param").replace(/:\w+/g, ":param");

const readSpecOperations = () => {
  const specification = yaml.load(
    fs.readFileSync(path.join(__dirname, "../docs/openAPI.yml"), "utf8"),
  );
  return Object.entries(specification.paths).flatMap(([routePath, item]) =>
    HTTP_METHODS.filter((method) => item[method]).map(
      (method) => `${method.toUpperCase()} ${normalizePath(routePath)}`,
    ),
  );
};

const readCodeOperations = () =>
  Object.entries(ROUTE_FILE_BY_PREFIX).flatMap(([prefix, fileName]) => {
    const source = fs.readFileSync(
      path.join(__dirname, `../src/routes/${fileName}.ts`),
      "utf8",
    );
    const routeMatches = [
      ...source.matchAll(/router\s*\.(get|post|put|patch|delete)\(\s*"([^"]*)"/g),
    ];
    return routeMatches.map(([, method, routePath]) => {
      const suffix = routePath === "/" ? "" : routePath;
      return `${method.toUpperCase()} ${normalizePath(`/${prefix}${suffix}`)}`;
    });
  });

const specOperations = new Set(readSpecOperations());
const codeOperations = new Set(readCodeOperations());

const missingInSpec = [...codeOperations].filter((op) => !specOperations.has(op));
const missingInCode = [...specOperations].filter((op) => !codeOperations.has(op));

if (missingInSpec.length > 0 || missingInCode.length > 0) {
  console.error("Routes missing in docs/openAPI.yml:", missingInSpec);
  console.error("Operations in the spec without a route:", missingInCode);
  process.exit(1);
}

console.log(`OpenAPI spec and routes are aligned (${codeOperations.size} operations).`);
