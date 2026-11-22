import { gradeRepository } from "../repositories/gradeRepository";
import { userRepository } from "../repositories/userRepository";
import { subjectRepository } from "../repositories/subjectRepository";
import { resultService } from "./resultService";
import {
  AbsenceMotifDto,
  CreateGradeDto,
  CreateGradeSessionDto,
  SessionGradeDto,
  UpdateGradeDto,
} from "../dtos/gradeDto";
import { SessionSubmission } from "../repositories/gradeRepository";
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

const assertEntriesMatchClass = (
  classStudentIds: string[],
  entries: SessionGradeDto[],
): void => {
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

const hasGradeValue = (entry: SessionGradeDto): boolean =>
  entry.value !== null && entry.value !== undefined;

const getClassStudentIds = (session: GradeSession): Promise<string[]> =>
  userRepository.findActiveStudentIdsByClassGroup(session.classGroup);

const buildSubmission = async (
  session: GradeSession,
  entries: SessionGradeDto[],
  motifs: AbsenceMotifDto[] = [],
): Promise<SessionSubmission> => {
  const classStudentIds = await getClassStudentIds(session);
  assertEntriesMatchClass(classStudentIds, entries);

  if (!entries.some(hasGradeValue)) {
    throw new AppError("At least one grade is required", 400);
  }

  const gradeByStudent = new Map(
    entries.map((entry) => [entry.studentId, entry.value ?? null]),
  );
  const normalizedEntries = classStudentIds.map((studentId) => ({
    studentId,
    value: gradeByStudent.get(studentId) ?? null,
  }));
  const absentStudentIds = normalizedEntries
    .filter((entry) => entry.value === null)
    .map((entry) => entry.studentId);
  const absenceMotifs = motifs.filter((motif) =>
    absentStudentIds.includes(motif.studentId),
  );

  return {
    entries: normalizedEntries,
    absentStudentIds,
    motifs: absenceMotifs.map((motif) => ({
      studentId: motif.studentId,
      motif: motif.motif.trim(),
    })),
  };
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
    assertEntriesMatchClass(await getClassStudentIds(session), entries);

    const saved = await gradeRepository.saveSessionDraft(
      id,
      entries.map((entry) => ({
        studentId: entry.studentId,
        value: entry.value ?? null,
      })),
    );
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
    const submission = await buildSubmission(session, entries);

    const submitted = await gradeRepository.submitSession(
      id,
      submission,
      secretaryId,
    );
    if (!submitted) {
      throw new AppError("Only an open session can be submitted", 409);
    }
    return getSessionOrThrow(id);
  },

  reviseSession: async (
    id: string,
    entries: SessionGradeDto[],
    motifs: AbsenceMotifDto[] = [],
  ) => {
    const session = await getSessionOrThrow(id);
    const submission = await buildSubmission(session, entries, motifs);

    const revised = await gradeRepository.reviseSession(id, submission);
    if (!revised) {
      throw new AppError(
        "Only a session pending review can be corrected",
        409,
      );
    }
    return getSessionOrThrow(id);
  },

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
