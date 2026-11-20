import { z } from "zod";

export const dayOfWeekEnum = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const attendanceSlotFields = {
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  targetClass: z.enum(["SECONDE", "PREMIERE", "TERMINALE", "ANCIEN"]),
  dayOfWeek: z.enum(dayOfWeekEnum),
  startTime: z.string().regex(TIME_FORMAT_REGEX, "Invalid time format"),
  endTime: z.string().regex(TIME_FORMAT_REGEX, "Invalid time format"),
  classroom: z.string().min(1, "Classroom is required").trim(),
};

export const createAttendanceSlotSchema = z.object({
  body: z.object(attendanceSlotFields),
});

export const updateAttendanceSlotSchema = z.object({
  params: z.object({ slotId: z.string().uuid() }),
  body: z.object(attendanceSlotFields).partial(),
});

export const dailyAttendanceQuerySchema = z.object({
  query: z.object({
    day: z.enum(dayOfWeekEnum),
    date: z.string().regex(DATE_FORMAT_REGEX, "Date must be YYYY-MM-DD"),
  }),
});

export const attendanceSummaryQuerySchema = z.object({
  query: z.object({ teacherId: z.string().uuid().optional() }),
});

export const checkAttendanceSchema = z.object({
  body: z.object({
    slotId: z.string().uuid(),
    attendanceDate: z
      .string()
      .regex(DATE_FORMAT_REGEX, "Date must be YYYY-MM-DD"),
  }),
});

export const markAbsenceSchema = z.object({
  body: z.object({
    slotId: z.string().uuid(),
    attendanceDate: z
      .string()
      .regex(DATE_FORMAT_REGEX, "Date must be YYYY-MM-DD"),
    motif: z.string().trim().min(1).optional(),
  }),
});

export const updateAttendanceMotifSchema = z.object({
  params: z.object({ slotId: z.string().uuid() }),
  body: z.object({
    attendanceDate: z
      .string()
      .regex(DATE_FORMAT_REGEX, "Date must be YYYY-MM-DD"),
    motif: z.string().trim().min(1, "Motif is required"),
  }),
});

export type CreateAttendanceSlotDto = z.infer<
  typeof createAttendanceSlotSchema
>["body"];
export type UpdateAttendanceSlotDto = z.infer<
  typeof updateAttendanceSlotSchema
>["body"];
export type CheckAttendanceDto = z.infer<typeof checkAttendanceSchema>["body"];
export type MarkAbsenceDto = z.infer<typeof markAbsenceSchema>["body"];
export type UpdateAttendanceMotifDto = z.infer<
  typeof updateAttendanceMotifSchema
>["body"];
