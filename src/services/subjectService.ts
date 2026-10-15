import { SubjectRepository } from "../repositories/subjectRepository";
import { UserRepository } from "../repositories/userRepository";
import { CreateSubjectDto, UpdateSubjectDto } from "../dtos/subjectDto";
import { AppError } from "../utils/AppError";

export class SubjectService {
  public static async createSubject(dto: CreateSubjectDto) {
    for (const assignment of dto.assignments) {
      const teacher = await UserRepository.findById(assignment.teacherId);
      if (!teacher || teacher.role !== "TEACHER") {
        throw new AppError(
          `Teacher with ID ${assignment.teacherId} not found or is not a teacher`,
          400,
        );
      }
    }
    return SubjectRepository.create(dto);
  }

  public static async getAllSubjects() {
    return SubjectRepository.findAll();
  }

  public static async getSubjectById(id: string) {
    const subject = await SubjectRepository.findById(id);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }
    return subject;
  }

  public static async deleteSubject(id: string) {
    const subject = await SubjectRepository.findById(id);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }
    await SubjectRepository.delete(id);
  }
}
