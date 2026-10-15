import { DisciplinaryRepository } from "../repositories/disciplinaryRepository";
import { UserRepository } from "../repositories/userRepository";
import { AppError } from "../utils/AppError";

export class DisciplinaryService {
  public static async addHistoryRecord(dto: any, adminId: string) {
    const student = await UserRepository.findById(dto.studentId);
    if (!student || student.role !== "STUDENT") {
      throw new AppError("Student not found", 404);
    }

    return DisciplinaryRepository.createHistoryRecord({
      ...dto,
      adminId,
    });
  }

  public static async updateHistoryRecord(id: string, dto: any) {
    const updated = await DisciplinaryRepository.updateHistoryRecord(id, dto);
    if (!updated) {
      throw new AppError(
        "History record not found or no changes provided",
        404,
      );
    }
    return updated;
  }

  public static async deleteHistoryRecord(id: string) {
    await DisciplinaryRepository.deleteHistoryRecord(id);
  }

  public static async addRemark(
    dto: any,
    authorId: string,
    authorRole: string,
  ) {
    const student = await UserRepository.findById(dto.studentId);
    if (!student || student.role !== "STUDENT") {
      throw new AppError("Student not found", 404);
    }

    return DisciplinaryRepository.createRemark({
      ...dto,
      authorId,
      authorRole,
    });
  }

  public static async updateRemark(id: string, dto: any) {
    const updated = await DisciplinaryRepository.updateRemark(id, dto);
    if (!updated) {
      throw new AppError("Remark not found or no changes provided", 404);
    }
    return updated;
  }

  public static async deleteRemark(id: string) {
    await DisciplinaryRepository.deleteRemark(id);
  }
}
