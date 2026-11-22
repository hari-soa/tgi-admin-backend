import { ClassGroup } from "./userDto";

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export interface CreateAttendanceSlotDto {
  teacherId: string;
  subjectId: string;
  targetClass: ClassGroup;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export type UpdateAttendanceSlotDto = Partial<CreateAttendanceSlotDto>;

export interface CheckAttendanceDto {
  slotId: string;
  attendanceDate: string;
}

export interface MarkAbsenceDto extends CheckAttendanceDto {
  motif?: string;
}

export interface UpdateAttendanceMotifDto {
  attendanceDate: string;
  motif: string;
}
