import { gradeRepository } from "../repositories/gradeRepository";
import { userRepository } from "../repositories/userRepository";
import { subjectRepository } from "../repositories/subjectRepository";
import { resultService } from "./resultService";
import {
  CreateGradeDto,
  CreateGradeSessionDto,
  SessionGradeDto,
  UpdateGradeDto,
} from "../dtos/gradeDto";
import { GradeSession, GradeSessionStatus } from "../models/gradeModel";
import { AppError } from "../utils/AppError";
import { getAcademicYear } from "../utils/academicYear";

const STATUSES_VISIBLE_TO_SECRETARY: GradeSessionStatus[] = [
  "OPEN",
  "PENDING_REVIEW",
];
const ALL_SESSION_STATUSES: GradeSessionStatus[] = [
  "OPEN",
  "PENDING_REVIEW",
  "VALIDATED",
];

const getSessionOrThrow = async (id: string): Promise<GradeSession> => {
  const session = await gradeRepository.findSessionById(id);
  if (!session) {
    throw new AppError("Grade session not found", 404);
  }
  return session;
};

/**
 * Every grade of a session must belong to an active student of the
 * session's class, and a student can appear only once.
 */
const assertEntriesMatchClass = async (
  session: GradeSession,
  entries: SessionGradeDto[],
): Promise<void> => {
  const classStudentIds = await userRepository.findActiveStudentIdsByClassGroup(
    session.classGroup,
  );
  const hasForeignStudent = entries.some(
    (entry) => !classStudentIds.includes(entry.studentId),
  );
  const uniqueStudentCount = new Set(entries.map((entry) => entry.studentId))
    .size;

  if (hasForeignStudent) {
    throw new AppError(
      "A grade references a student who is not active in this class",
      400,
    );
  }
  if (uniqueStudentCount !== entries.length) {
    throw new AppError("A student cannot have two grades in one session", 400);
  }
};

export const gradeService = {
  createGrade: async (dto: CreateGradeDto, secretaryId: string) => {
    return gradeRepository.create(dto, secretaryId);
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

  updateGrade: async (id: string, dto: UpdateGradeDto) => {
    const updatedGrade = await gradeRepository.update(id, dto);
    if (!updatedGrade) {
      throw new AppError("Grade not found", 404);
    }
    return updatedGrade;
  },

  reviewGrade: async (id: string, status: string, adminId: string) => {
    const reviewedGrade = await gradeRepository.updateStatus(
      id,
      status,
      adminId,
    );
    if (!reviewedGrade) {
      throw new AppError("Grade not found", 404);
    }
    return reviewedGrade;
  },

  deleteGrade: async (id: string) => {
    const success = await gradeRepository.delete(id);
    if (!success) {
      throw new AppError("Grade not found or already deleted", 404);
    }
  },

  createSession: async (dto: CreateGradeSessionDto, adminId: string) => {
    const subject = await subjectRepository.findById(dto.subjectId);
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    return gradeRepository.createSession(
      dto.classGroup,
      dto.subjectId,
      dto.examType,
      dto.term,
      getAcademicYear(),
      adminId,
    );
  },

  getSessions: async (role: string) => {
    const statuses =
      role === "ADMIN" ? ALL_SESSION_STATUSES : STATUSES_VISIBLE_TO_SECRETARY;
    return gradeRepository.findSessions(statuses);
  },

  saveSessionDraft: async (id: string, entries: SessionGradeDto[]) => {
    const session = await getSessionOrThrow(id);
    await assertEntriesMatchClass(session, entries);

    const saved = await gradeRepository.saveSessionDraft(id, entries);
    if (!saved) {
      throw new AppError("Only an open session can be edited", 409);
    }
    return getSessionOrThrow(id);
  },

  submitSession: async (
    id: string,
    entries: SessionGradeDto[],
    secretaryId: string,
  ) => {
    const session = await getSessionOrThrow(id);
    await assertEntriesMatchClass(session, entries);

    const submitted = await gradeRepository.submitSession(
      id,
      entries,
      secretaryId,
    );
    if (!submitted) {
      throw new AppError("Only an open session can be submitted", 409);
    }
    return getSessionOrThrow(id);
  },

  /**
   * Publishes the grades of a session, then refreshes the annual report of
   * every student concerned so that the grades appear in their report card.
   */
  validateSession: async (id: string, adminId: string) => {
    await getSessionOrThrow(id);

    const validation = await gradeRepository.validateSession(id, adminId);
    if (!validation) {
      throw new AppError("Only a session pending review can be validated", 409);
    }

    const { session, studentIds } = validation;
    await resultService.refreshResultsFromPublishedGrades(
      studentIds,
      session.classGroup,
      session.academicYear,
      session.submittedBySecretaryId as string,
      adminId,
    );
    return session;
  },
};
