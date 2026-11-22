import { teacherAttendanceRepository } from "../repositories/teacherAttendanceRepository";
import {
  CheckAttendanceDto,
  CreateAttendanceSlotDto,
  MarkAbsenceDto,
  UpdateAttendanceMotifDto,
  UpdateAttendanceSlotDto,
} from "../dtos/teacherAttendanceDto";
import { AttendanceStatus } from "../models/teacherAttendanceModel";
import { AppError } from "../utils/AppError";
import { getSchoolClock } from "../utils/schoolTime";

const MAX_SIMULTANEOUS_CLASSROOMS = 2;
const MINUTES_PER_HOUR = 60;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
};

const assertSlotExists = async (slotId: string) => {
  const slot = await teacherAttendanceRepository.findSlotById(slotId);
  if (!slot) {
    throw new AppError("Attendance slot not found", 404);
  }
  return slot;
};

const assertEndAfterStart = (startTime: string, endTime: string): void => {
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw new AppError("The end time must be after the start time", 400);
  }
};

const assertTeacherIsNotOverbooked = async (
  teacherId: string,
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  excludeSlotId?: string,
): Promise<void> => {
  const overlappingCount =
    await teacherAttendanceRepository.countOverlappingSlots(
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
      excludeSlotId,
    );

  if (overlappingCount >= MAX_SIMULTANEOUS_CLASSROOMS) {
    throw new AppError(
      `Teacher cannot exceed ${MAX_SIMULTANEOUS_CLASSROOMS} simultaneous classrooms at this time slot`,
      400,
    );
  }
};

export const teacherAttendanceService = {
  createSlot: async (dto: CreateAttendanceSlotDto) => {
    assertEndAfterStart(dto.startTime, dto.endTime);
    await assertTeacherIsNotOverbooked(
      dto.teacherId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );
    return teacherAttendanceRepository.createSlot(dto);
  },

  updateSlot: async (slotId: string, dto: UpdateAttendanceSlotDto) => {
    const slot = await assertSlotExists(slotId);

    const mergedSlot = { ...slot, ...dto };
    assertEndAfterStart(mergedSlot.startTime, mergedSlot.endTime);
    await assertTeacherIsNotOverbooked(
      mergedSlot.teacherId,
      mergedSlot.dayOfWeek,
      mergedSlot.startTime,
      mergedSlot.endTime,
      slotId,
    );

    return teacherAttendanceRepository.updateSlot(slotId, dto);
  },

  deleteSlot: async (slotId: string): Promise<void> => {
    await assertSlotExists(slotId);
    await teacherAttendanceRepository.deleteSlot(slotId);
  },

  getDailyCards: async (dayOfWeek: string, attendanceDate: string) => {
    return teacherAttendanceRepository.getDailyCards(dayOfWeek, attendanceDate);
  },

  checkAttendance: async (dto: CheckAttendanceDto, recordedBy: string) => {
    const slot = await assertSlotExists(dto.slotId);

    const schoolClock = getSchoolClock();
    const isToday = dto.attendanceDate === schoolClock.date;
    const currentMinutes =
      schoolClock.hours * MINUTES_PER_HOUR + schoolClock.minutes;
    const lateMinutes = isToday
      ? Math.max(0, currentMinutes - toMinutes(slot.startTime))
      : 0;
    const status: AttendanceStatus = lateMinutes > 0 ? "LATE" : "PRESENT";

    return teacherAttendanceRepository.upsertAttendance({
      slotId: dto.slotId,
      attendanceDate: dto.attendanceDate,
      status,
      checkInTime: new Date(),
      lateMinutes,
      recordedBy,
    });
  },

  markAbsence: async (dto: MarkAbsenceDto, recordedBy: string) => {
    await assertSlotExists(dto.slotId);

    return teacherAttendanceRepository.upsertAttendance({
      slotId: dto.slotId,
      attendanceDate: dto.attendanceDate,
      status: "ABSENT",
      checkInTime: null,
      lateMinutes: 0,
      recordedBy,
      motif: dto.motif,
    });
  },

  updateMotif: async (slotId: string, dto: UpdateAttendanceMotifDto) => {
    const updated = await teacherAttendanceRepository.updateMotif(
      slotId,
      dto.attendanceDate,
      dto.motif,
    );
    if (!updated) {
      throw new AppError("Attendance record not found for this date", 404);
    }
    return updated;
  },

  getSummaryCards: async (teacherId?: string) => {
    return teacherAttendanceRepository.getSummaryCards(teacherId);
  },
};
