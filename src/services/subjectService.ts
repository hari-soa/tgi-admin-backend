import { subjectRepository } from "../repositories/subjectRepository";
import { userRepository } from "../repositories/userRepository";
import { CreateSubjectDto, UpdateSubjectDto } from "../dtos/subjectDto";
import { AppError } from "../utils/AppError";

export const subjectService = {
  createSubject: async (dto: CreateSubjectDto) => {
    for (const assignment of dto.assignments) {
      const teacher = await userRepository.findById(assignment.teacherId);
      if (!teacher || (teacher.role || "").toUpperCase() !== "TEACHER") {
        throw new AppError(
          `Teacher with ID ${assignment.teacherId} not found or is not a teacher`,
          400,
        );
      }
    }
    try {
      return await subjectRepository.create(dto);
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes("already exists and is active")
      ) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  },

  updateSubject: async (id: string, dto: UpdateSubjectDto) => {
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    if (dto.assignments) {
      for (const assignment of dto.assignments) {
        const teacher = await userRepository.findById(assignment.teacherId);
        if (!teacher || (teacher.role || "").toUpperCase() !== "TEACHER") {
          throw new AppError(
            `Teacher with ID ${assignment.teacherId} not found or is not a teacher`,
            400,
          );
        }
      }
    }

    return subjectRepository.update(id, dto);
  },

  getAllSubjects: async () => {
    return subjectRepository.findAll();
  },

  getSubjectById: async (id: string) => {
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }
    return subject;
  },

  deleteSubject: async (id: string) => {
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }
    await subjectRepository.deactivate(id);
  },
};
