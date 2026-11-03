import { teacherAttendanceRepository } from "../repositories/teacherAttendanceRepository";
import { CreateAttendanceSlotDto } from "../dtos/teacherAttendanceDto";
import { AppError } from "../utils/AppError";

export const teacherAttendanceService = {
  createSlot: async (dto: CreateAttendanceSlotDto): Promise<any> => {
    const overlappingCount =
      await teacherAttendanceRepository.countOverlappingSlots(
        dto.teacherId,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
      );

    if (overlappingCount >= 2) {
      throw new AppError(
        "Teacher cannot exceed 2 simultaneous classrooms at this time slot",
        400,
      );
    }

    return await teacherAttendanceRepository.createSlot(dto);
  },

  updateSlot: async (slotId: string, dto: any): Promise<any> => {
    const slot = await teacherAttendanceRepository.findSlotById(slotId);
    if (!slot) {
      throw new AppError("Attendance slot not found", 404);
    }
    return await teacherAttendanceRepository.updateSlot(slotId, dto);
  },

  deleteSlot: async (slotId: string): Promise<any> => {
    const slot = await teacherAttendanceRepository.findSlotById(slotId);
    if (!slot) {
      throw new AppError("Attendance slot not found", 404);
    }
    return await teacherAttendanceRepository.deleteSlot(slotId);
  },

  getDailyCards: async (
    dayOfWeek: string,
    attendanceDate: string,
  ): Promise<any[]> => {
    return await teacherAttendanceRepository.getDailyCards(
      dayOfWeek,
      attendanceDate,
    );
  },

  checkAttendance: async (
    slotId: string,
    attendanceDate: string,
    recordedBy: string,
  ): Promise<any> => {
    const slot = await teacherAttendanceRepository.findSlotById(slotId);
    if (!slot) {
      throw new AppError("Attendance slot not found", 404);
    }

    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 8);

    let status = "PRESENT";
    let lateMinutes = 0;

    if (currentTimeStr > slot.start_time) {
      status = "LATE";
      const [startHour, startMin] = slot.start_time.split(":").map(Number);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      lateMinutes = currentHour * 60 + currentMin - (startHour * 60 + startMin);
      if (lateMinutes < 0) lateMinutes = 0;
    }

    return await teacherAttendanceRepository.upsertAttendance(
      slotId,
      attendanceDate,
      status,
      now,
      lateMinutes,
      recordedBy,
    );
  },

  updateMotif: async (
    slotId: string,
    attendanceDate: string,
    motif: string,
    userRole: string,
  ): Promise<any> => {
    if (userRole !== "ADMIN") {
      throw new AppError(
        "Only administrators can update or add absence motifs",
        403,
      );
    }

    const updated = await teacherAttendanceRepository.updateMotif(
      slotId,
      attendanceDate,
      motif,
    );
    if (!updated) {
      throw new AppError("Attendance record not found for this date", 404);
    }

    return updated;
  },

  getSummaryCards: async (teacherId?: string): Promise<any[]> => {
    return await teacherAttendanceRepository.getSummaryCards(teacherId);
  },
};
