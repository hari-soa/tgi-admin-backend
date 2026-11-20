import { announcementRepository } from "../repositories/announcementRepository";
import { userRepository } from "../repositories/userRepository";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "../dtos/announcementDto";
import { Announcement } from "../models/announcementModel";
import { TokenPayload } from "../utils/jwt";
import { AppError } from "../utils/AppError";

const canSeeAnnouncement = (
  announcement: Announcement,
  studentClassGroup: string | undefined,
): boolean =>
  announcement.targetScope === "ALL" ||
  (studentClassGroup !== undefined &&
    announcement.targetClasses.includes(studentClassGroup));

const getStudentClassGroup = async (
  requester: TokenPayload,
): Promise<string | undefined> => {
  if (requester.role !== "STUDENT") {
    return undefined;
  }
  const student = await userRepository.findById(requester.userId);
  return (student as { classGroup?: string } | null)?.classGroup;
};

export const announcementService = {
  createAnnouncement: async (dto: CreateAnnouncementDto, authorId: string) => {
    return announcementRepository.create(dto, authorId);
  },

  /** Students only receive the announcements addressed to them. */
  getAllAnnouncements: async (requester: TokenPayload) => {
    if (requester.role !== "STUDENT") {
      return announcementRepository.findAll();
    }
    const classGroup = await getStudentClassGroup(requester);
    return announcementRepository.findAll(classGroup ?? "NO_CLASS");
  },

  getAnnouncementById: async (id: string, requester: TokenPayload) => {
    const announcement = await announcementRepository.findById(id);
    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }

    if (requester.role === "STUDENT") {
      const classGroup = await getStudentClassGroup(requester);
      if (!canSeeAnnouncement(announcement, classGroup)) {
        throw new AppError("Announcement not found", 404);
      }
    }
    return announcement;
  },

  updateAnnouncement: async (id: string, dto: UpdateAnnouncementDto) => {
    const updated = await announcementRepository.update(id, dto);
    if (!updated) {
      throw new AppError("Announcement not found", 404);
    }
    return updated;
  },

  deleteAnnouncement: async (id: string) => {
    const deleted = await announcementRepository.delete(id);
    if (!deleted) {
      throw new AppError("Announcement not found", 404);
    }
  },
};
