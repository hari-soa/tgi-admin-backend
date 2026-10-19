import { resultRepository } from "../repositories/resultRepository";
import {
  CreateAnnualResultDto,
  UpdateAnnualResultDto,
} from "../dtos/resultDto";
import { AppError } from "../utils/AppError";

export const resultService = {
  createResult: async (dto: CreateAnnualResultDto, secretaryId: string) => {
    return resultRepository.createAnnualResult(dto, secretaryId);
  },

  getResultById: async (id: string) => {
    const result = await resultRepository.findById(id);
    if (!result) {
      throw new AppError("Annual result or bulletin not found", 404);
    }
    return result;
  },

  reviewResult: async (
    id: string,
    status: string,
    decision: string,
    adminId: string,
  ) => {
    const existing = await resultRepository.findById(id);
    if (!existing) {
      throw new AppError("Annual result not found", 404);
    }

    const updated = await resultRepository.updateStatusAndDecision(
      id,
      status,
      decision,
      adminId,
    );
    return updated;
  },

  getStudentHistory: async (studentId: string) => {
    return resultRepository.findByStudentId(studentId);
  },
};
