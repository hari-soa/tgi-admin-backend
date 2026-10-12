import { AnnouncementRepository } from "../repositories/announcementRepository";
import { CreateAnnouncementDto } from "../dtos/announcementDto";
import { AppError } from "../utils/AppError";

export class AnnouncementService {
  public static async createAnnouncement(
    dto: CreateAnnouncementDto,
    authorId: string,
    targetClasses?: string[],
  ) {
    return AnnouncementRepository.create(dto, authorId, targetClasses);
  }

  public static async getAllAnnouncements() {
    return AnnouncementRepository.findAll();
  }

  public static async getAnnouncementById(id: string) {
    const announcement = await AnnouncementRepository.findById(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    return announcement;
  }

  public static async deleteAnnouncement(id: string) {
    const announcement = await AnnouncementRepository.findById(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }
    await AnnouncementRepository.delete(id);
  }
}
