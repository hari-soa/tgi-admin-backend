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

  getAllGrades: async () => {
    return gradeRepository.findAll();
  },

  getGradeById: async (id: string) => {
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new AppError("Grade not found", 404);
    }
    return grade;
  },

  updateGrade: async (id: string, dto: Partial<CreateGradeDto>) => {
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new AppError("Grade not found", 404);
    }
    return gradeRepository.update(id, dto);
  },

  reviewGrade: async (id: string, status: string, adminId: string) => {
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new AppError("Grade not found", 404);
    }
    return gradeRepository.updateStatus(id, status, adminId);
  },

  deleteGrade: async (id: string) => {
    const success = await gradeRepository.delete(id);
    if (!success) {
      throw new AppError("Grade not found or already deleted", 404);
    }
    return { message: "Grade deleted successfully" };
  },
};
