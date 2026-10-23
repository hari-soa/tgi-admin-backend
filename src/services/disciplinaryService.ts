import { disciplinaryRepository } from "../repositories/disciplinaryRepository";
import { userRepository } from "../repositories/userRepository";
import { AppError } from "../utils/AppError";

export const disciplinaryService = {
  addHistoryRecord: async (dto: any, adminId: string) => {
    const student = await userRepository.findById(dto.studentId);
    if (!student || student.role !== "STUDENT") {
      throw new AppError("Student not found", 404);
    }

    return disciplinaryRepository.createHistoryRecord({
      ...dto,
      adminId,
    });
  },

  updateHistoryRecord: async (id: string, dto: any) => {
    const updated = await disciplinaryRepository.updateHistoryRecord(id, dto);
    if (!updated) {
      throw new AppError(
        "History record not found or no changes provided",
        404,
      );
    }
    return updated;
  },

  deleteHistoryRecord: async (id: string) => {
    await disciplinaryRepository.deleteHistoryRecord(id);
  },

  addRemark: async (dto: any, authorId: string, authorRole: string) => {
    const student = await userRepository.findById(dto.studentId);
    if (!student || student.role !== "STUDENT") {
      throw new AppError("Student not found", 404);
    }

    return disciplinaryRepository.createRemark({
      ...dto,
      authorId,
      authorRole,
    });
  },

  updateRemark: async (id: string, dto: any) => {
    const updated = await disciplinaryRepository.updateRemark(id, dto);
    if (!updated) {
      throw new AppError("Remark not found or no changes provided", 404);
    }
    return updated;
  },

  deleteRemark: async (id: string) => {
    await disciplinaryRepository.deleteRemark(id);
  },
};
