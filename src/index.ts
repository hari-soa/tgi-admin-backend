import express from "express";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";

const app = express();

app.use(express.json());

app.all("*", (req, _res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
