import { scheduleRepository } from "../repositories/scheduleRepository";
import { CreateTimetableDto } from "../dtos/scheduleDto";
import { AppError } from "../utils/AppError";

export const scheduleService = {
  createTimetable: async (dto: CreateTimetableDto, adminId: string) => {
    return scheduleRepository.create(dto, adminId);
  },

  getAllTimetables: async () => {
    return scheduleRepository.findAll();
  },

  getTimetableById: async (id: string) => {
    const timetable = await scheduleRepository.findById(id);
    if (!timetable) {
      throw new AppError("Timetable not found", 404);
    }
    return timetable;
  },

  deleteTimetable: async (id: string) => {
    const timetable = await scheduleRepository.findById(id);
    if (!timetable) {
      throw new AppError("Timetable not found", 404);
    }
    await scheduleRepository.delete(id);
  },
};
