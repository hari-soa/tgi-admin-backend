import { Router } from "express";
import { scheduleController } from "../controllers/scheduleController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createTimetableSchema } from "../dtos/scheduleDto";

const router = Router();

router.use(authenticate);

router.get("/", scheduleController.getAll);
router.get("/:id", scheduleController.getById);

router.post(
  "/",
  authorize("ADMIN"),
  validate(createTimetableSchema),
  scheduleController.create,
);

router.delete("/:id", authorize("ADMIN"), scheduleController.delete);

export default router;
