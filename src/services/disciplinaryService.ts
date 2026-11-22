import { disciplinaryRepository } from "../repositories/disciplinaryRepository";
import { userRepository } from "../repositories/userRepository";
import {
  CreateStudentHistoryRecordDto,
  UpdateStudentHistoryRecordDto,
} from "../dtos/studentHistoryDto";
import {
  CreateStudentRemarkDto,
  UpdateStudentRemarkDto,
} from "../dtos/studentRemarkDto";
import { TokenPayload } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { assertCanAccessStudentData } from "../utils/accessControl";

const assertStudentExists = async (studentId: string): Promise<void> => {
  const student = await userRepository.findById(studentId);
  if (!student || student.role !== "STUDENT") {
    throw new AppError("Student not found", 404);
  }
};

const assertPeriodIsValid = (startDate?: string, endDate?: string): void => {
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new AppError("End date cannot be before start date", 400);
  }
};

export const disciplinaryService = {
  addHistoryRecord: async (
    dto: CreateStudentHistoryRecordDto,
    adminId: string,
  ) => {
    await assertStudentExists(dto.studentId);
    assertPeriodIsValid(dto.startDate, dto.endDate);
    return disciplinaryRepository.createHistoryRecord(dto, adminId);
  },

  getStudentHistory: async (studentId: string, requester: TokenPayload) => {
    assertCanAccessStudentData(requester, studentId);
    return disciplinaryRepository.findHistoryByStudentId(studentId);
  },

  updateHistoryRecord: async (
    id: string,
    dto: UpdateStudentHistoryRecordDto,
  ) => {
    assertPeriodIsValid(dto.startDate, dto.endDate);
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
    const deleted = await disciplinaryRepository.deleteHistoryRecord(id);
    if (!deleted) {
      throw new AppError("History record not found", 404);
    }
  },

  addRemark: async (
    dto: CreateStudentRemarkDto,
    authorId: string,
    authorRole: string,
  ) => {
    await assertStudentExists(dto.studentId);
    return disciplinaryRepository.createRemark(dto, authorId, authorRole);
  },

  getStudentRemarks: async (studentId: string, requester: TokenPayload) => {
    assertCanAccessStudentData(requester, studentId);
    return disciplinaryRepository.findRemarksByStudentId(studentId);
  },

  updateRemark: async (id: string, dto: UpdateStudentRemarkDto) => {
    const updated = await disciplinaryRepository.updateRemark(id, dto);
    if (!updated) {
      throw new AppError("Remark not found or no changes provided", 404);
    }
    return updated;
  },

  deleteRemark: async (id: string) => {
    const deleted = await disciplinaryRepository.deleteRemark(id);
    if (!deleted) {
      throw new AppError("Remark not found", 404);
    }
  },
};
