import { GradeRepository } from "../repositories/gradeRepository";
import { CreateAnnualResultDto } from "../dtos/resultDto";
import { AppError } from "../utils/AppError";

export class GradeService {
  public static async transcribeGrade(data: any, secretaryId: string) {
    return GradeRepository.createGrade({ ...data, secretaryId });
  }

  public static async submitAnnualResult(
    dto: CreateAnnualResultDto,
    secretaryId: string,
  ) {
    return GradeRepository.createAnnualResult(dto, secretaryId);
  }

  public static async reviewAnnualResult(
    id: string,
    status: "APPROVED" | "PUBLISHED" | "DRAFT",
    decision: "PASS" | "FAIL" | "PENDING",
    adminId: string,
  ) {
    const updated = await GradeRepository.updateAnnualResultStatusAndDecision(
      id,
      status,
      decision,
      adminId,
    );
    if (!updated) {
      throw new AppError("Annual result not found", 404);
    }
    return updated;
  }

  public static async getResultById(id: string) {
    const result = await GradeRepository.findAnnualResultById(id);
    if (!result) {
      throw new AppError("Annual result not found", 404);
    }
    return result;
  }
}
