import { announcementRepository } from "../repositories/announcementRepository";
import { CreateAnnouncementDto } from "../dtos/announcementDto";
import { AppError } from "../utils/AppError";

export const announcementService = {
  createAnnouncement: async (
    dto: CreateAnnouncementDto,
    authorId: string,
    targetClasses?: string[],
  ) => {
    return announcementRepository.create(dto, authorId, targetClasses);
  },

  getAllAnnouncements: async () => {
    return announcementRepository.findAll();
  },

  getAnnouncementById: async (id: string) => {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    return announcement;
  },

  deleteAnnouncement: async (id: string) => {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    await announcementRepository.delete(id);
  },
};
