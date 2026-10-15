import express from "express";
import cors from "cors";
import helmet from "helmet";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import announcementRoutes from "./routes/announcementRoutes";
import disciplinaryRoutes from "./routes/disciplinaryRoutes";
import subjectRoutes from "./routes/subjectRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";

const app = express();
const PORT = process.env.PORT;

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/announcements", announcementRoutes);
app.use("/api/v1/disciplinary", disciplinaryRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/api/v1/schedule", scheduleRoutes);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.all(/(.*)/, (req, _res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
