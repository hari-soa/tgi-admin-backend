import { announcementRepository } from "../repositories/announcementRepository";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "../dtos/announcementDto";
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

  updateAnnouncement: async (
    id: string,
    dto: UpdateAnnouncementDto,
    targetClasses?: string[],
  ) => {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    return announcementRepository.update(id, dto, targetClasses);
  },

  deleteAnnouncement: async (id: string) => {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    await announcementRepository.delete(id);
  },
};
