import { resultRepository } from "../repositories/resultRepository";
import {
  CreateAnnualResultDto,
  UpdateAnnualResultDto,
} from "../dtos/resultDto";
import { AppError } from "../utils/AppError";
import { pdfService } from "./pdfService";

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

  generateAndExportPdf: async (
    resultId: string,
    requestingUser: { userId: string; role: string },
  ) => {
    const result = await resultRepository.findById(resultId);
    if (!result) {
      throw new AppError("Annual result not found", 404);
    }

    if (requestingUser.role === "STUDENT") {
      if (result.studentId !== requestingUser.userId) {
        throw new AppError(
          "Forbidden: You can only export your own bulletin",
          403,
        );
      }
      if (result.status !== "PUBLISHED") {
        throw new AppError("Forbidden: Bulletin is not published yet", 403);
      }
    }

    const studentName = "Nom de l'élève";
    const pdfUrl = await pdfService.generateBulletinPdf(result, studentName);

    await resultRepository.updatePdfExportUrl(resultId, pdfUrl);

    return { pdfUrl };
  },
};
