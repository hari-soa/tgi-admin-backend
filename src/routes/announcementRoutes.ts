import { Router } from "express";
import { AnnouncementController } from "../controllers/announcementController";
import { authenticate, authorize } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddlewares";
import { createAnnouncementSchema } from "../dtos/announcementDto";

const router = Router();

router.use(authenticate);

router.get("/", AnnouncementController.getAll);
router.get("/:id", AnnouncementController.getById);

router.post(
  "/",
  authorize("ADMIN"),
  validate(createAnnouncementSchema),
  AnnouncementController.create,
);

router.delete("/:id", authorize("ADMIN"), AnnouncementController.delete);

export default router;
