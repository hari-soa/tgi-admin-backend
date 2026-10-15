import { ScheduleRepository } from "../repositories/scheduleRepository";
import { CreateTimetableDto } from "../dtos/scheduleDto";
import { AppError } from "../utils/AppError";

export class ScheduleService {
  public static async createTimetable(
    dto: CreateTimetableDto,
    adminId: string,
  ) {
    return ScheduleRepository.create(dto, adminId);
  }

  public static async getAllTimetables() {
    return ScheduleRepository.findAll();
  }

  public static async getTimetableById(id: string) {
    const timetable = await ScheduleRepository.findById(id);
    if (!timetable) {
      throw new AppError("Timetable not found", 404);
    }
    return timetable;
  }

  public static async deleteTimetable(id: string) {
    const timetable = await ScheduleRepository.findById(id);
    if (!timetable) {
      throw new AppError("Timetable not found", 404);
    }
    await ScheduleRepository.delete(id);
  }
}
