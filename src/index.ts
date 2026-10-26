import express from "express";
import cors from "cors";
import helmet from "helmet";
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

const app = express();
const PORT = process.env.PORT;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/disciplinary", disciplinaryRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/api/v1/teacherAttendance", teacherAttendanceRoutes);
app.use("/api/v1/grade", gradeRoutes);

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
