import { z } from "zod";

const dayOfWeekEnum = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]);

const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export const createAttendanceSlotSchema = z.object({
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  targetClass: z.string().min(1),
  dayOfWeek: dayOfWeekEnum,
  startTime: z.string().regex(timeFormatRegex),
  endTime: z.string().regex(timeFormatRegex),
  classroom: z.string().min(1),
});

export const updateAttendanceSlotSchema = createAttendanceSlotSchema.partial();

export const checkAttendanceSchema = z.object({
  slotId: z.string().uuid(),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateAttendanceMotifSchema = z.object({
  motif: z.string().min(1),
});

export type CreateAttendanceSlotDto = z.infer<
  typeof createAttendanceSlotSchema
>;
export type UpdateAttendanceSlotDto = z.infer<
  typeof updateAttendanceSlotSchema
>;
export type CheckAttendanceDto = z.infer<typeof checkAttendanceSchema>;
export type UpdateAttendanceMotifDto = z.infer<
  typeof updateAttendanceMotifSchema
>;
