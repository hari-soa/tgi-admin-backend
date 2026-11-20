import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";
import { connectDB } from "./config/db";
import { seedSuperAdmin } from "./seeders/adminSeeder";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import announcementRoutes from "./routes/announcementRoutes";
import disciplinaryRoutes from "./routes/disciplinaryRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import teacherAttendanceRoutes from "./routes/teacherAttendanceRoutes";
import gradeRoutes from "./routes/gradeRoutes";
import resultRoutes from "./routes/resultRoutes";

const DEFAULT_PORT = 3000;
const JSON_BODY_LIMIT = "5mb"; // profile pictures are sent as data URLs
const API_PREFIX = "/api/v1";

const app = express();
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

// The API documentation is the OpenAPI file shipped with the project.
const openApiSpecification = yaml.load(
  fs.readFileSync(path.join(__dirname, "../docs/openAPI.yml"), "utf8"),
) as swaggerUi.JsonObject;
app.use(
  `${API_PREFIX}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(openApiSpecification),
);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));

// Generated report cards (PDF)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/disciplinary`, disciplinaryRoutes);
app.use(`${API_PREFIX}/subjects`, subjectRoutes);
app.use(`${API_PREFIX}/attendance`, teacherAttendanceRoutes);
app.use(`${API_PREFIX}/grades`, gradeRoutes);
app.use(`${API_PREFIX}/results`, resultRoutes);

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
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
