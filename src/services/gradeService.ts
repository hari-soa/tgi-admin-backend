import { gradeRepository } from "../repositories/gradeRepository";
import { CreateGradeDto, SubmitGradeSessionDto } from "../dtos/gradeDto";
import { AppError } from "../utils/AppError";

export const gradeService = {
  createGrade: async (dto: CreateGradeDto, secretaryId: string) => {
    return gradeRepository.create(dto, secretaryId);
  },

  submitSession: async (dto: SubmitGradeSessionDto, secretaryId: string) => {
    return gradeRepository.submitSession(dto, secretaryId);
  },

  reviewGrade: async (id: string, status: string, adminId: string) => {
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new AppError("Grade not found", 404);
    }
    const updated = await gradeRepository.updateStatus(id, status, adminId);
    return updated;
  },

  getGradeById: async (id: string) => {
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new AppError("Grade not found", 404);
    }
    return grade;
  },
};
