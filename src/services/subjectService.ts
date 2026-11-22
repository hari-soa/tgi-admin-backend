import { subjectRepository } from "../repositories/subjectRepository";
import { userRepository } from "../repositories/userRepository";
import {
  ClassAssignmentDto,
  CreateSubjectDto,
  UpdateSubjectDto,
} from "../dtos/subjectDto";
import { AppError } from "../utils/AppError";

const assertAssignmentsTargetTeachers = async (
  assignments: ClassAssignmentDto[],
): Promise<void> => {
  const teachers = await Promise.all(
    assignments.map(({ teacherId }) => userRepository.findById(teacherId)),
  );
  const invalidIndex = teachers.findIndex(
    (teacher) => !teacher || teacher.role !== "TEACHER",
  );

  if (invalidIndex >= 0) {
    throw new AppError(
      `Teacher with ID ${assignments[invalidIndex].teacherId} not found or is not a teacher`,
      400,
    );
  }
};

export const subjectService = {
  createSubject: async (dto: CreateSubjectDto) => {
    await assertAssignmentsTargetTeachers(dto.assignments);
    return subjectRepository.create({ ...dto, name: dto.name.trim() });
  },

  updateSubject: async (id: string, dto: UpdateSubjectDto) => {
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    if (dto.assignments) {
      await assertAssignmentsTargetTeachers(dto.assignments);
    }

    return subjectRepository.update(id, {
      ...dto,
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
    });
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
