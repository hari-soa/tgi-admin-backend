import { Router } from "express";
import { eventController } from "../controllers/eventController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createEventSchema } from "../dtos/eventDto";

const router = Router();

router.use(authenticate);

router.get("/", eventController.getAll);
router.get("/:id", eventController.getById);

router.post(
  "/",
  authorize("ADMIN"),
  validate(createEventSchema),
  eventController.create,
);

router.delete("/:id", authorize("ADMIN"), eventController.delete);

export default router;
