import { Router } from "express";
import { announcementController } from "../controllers/announcementController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createAnnouncementSchema } from "../dtos/announcementDto";

const router = Router();

router.use(authenticate);

router.get("/", announcementController.getAll);
router.get("/:id", announcementController.getById);

router.post(
  "/",
  authorize("ADMIN"),
  validate(createAnnouncementSchema),
  announcementController.create,
);

router.delete("/:id", authorize("ADMIN"), announcementController.delete);

export default router;
