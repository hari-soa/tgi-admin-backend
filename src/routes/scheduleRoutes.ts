import { Router } from "express";
import { ScheduleController } from "../controllers/scheduleController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createTimetableSchema } from "../dtos/scheduleDto";

const router = Router();

router.use(authenticate);

router.get("/", ScheduleController.getAll);
router.get("/:id", ScheduleController.getById);

router.post(
  "/",
  authorize("ADMIN"),
  validate(createTimetableSchema),
  ScheduleController.create,
);

router.delete("/:id", authorize("ADMIN"), ScheduleController.delete);

export default router;
