import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { createSpecificationMiddleware } from "./middlewares/validateMiddlewares";
import { AppError } from "./utils/AppError";
import {
  API_PREFIX,
  DOCS_PATH,
  SPEC_PATH,
  specification,
} from "./utils/specification";
import { connectDB } from "./config/db";
import { seedSuperAdmin } from "./seeders/adminSeeder";

const DEFAULT_PORT = 3000;
const JSON_BODY_LIMIT = "5mb";

const app = express();
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

app.use(
  DOCS_PATH,
  swaggerUi.serve,
  swaggerUi.setup(specification as swaggerUi.JsonObject, {
    customSiteTitle: "TGI Admin API",
  }),
);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    data: { api: API_PREFIX, documentation: DOCS_PATH, specification: SPEC_PATH },
  });
});

app.use(createSpecificationMiddleware());

app.all(/(.*)/, (req, _res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await seedSuperAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API documentation: http://localhost:${PORT}${DOCS_PATH}`);
      console.log(`API specification: http://localhost:${PORT}${SPEC_PATH}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
