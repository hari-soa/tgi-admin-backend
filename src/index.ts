import express from "express";
import cors from "cors";
import helmet from "helmet";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";
import authRoutes from "./routes/authRoutes";

const app = express();
const PORT = process.env.PORT;

app.use("/api/v1/auth", authRoutes);

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
