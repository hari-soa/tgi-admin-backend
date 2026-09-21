import { z } from "zod";

export const eventTypeEnum = ["COURSE", "EXAM", "OTHER"] as const;

const baseScheduleEventSchema = z.object({
  startTime: z.coerce.date({ message: "Invalid or missing start time" }),
  endTime: z.coerce.date({ message: "Invalid or missing end time" }),
  createdByAdminId: z.string({ message: "Admin ID is required" }),
});

export const courseEventSchema = baseScheduleEventSchema.extend({
  type: z.literal("COURSE"),
  subjectId: z.string({ message: "Subject ID is required" }),
  targetClass: z.string({ message: "Target class is required" }),
  teacherId: z.string().optional(),
  classroom: z.string({ message: "Classroom is required" }),
});

export const examSubjectDetailSchema = z.object({
  subjectId: z.string({ message: "Subject ID is required" }),
  durationInMinutes: z
    .number({ message: "Duration in minutes is required" })
    .positive("Duration must be greater than 0"),
});

export const examEventSchema = baseScheduleEventSchema.extend({
  type: z.literal("EXAM"),
  targetClasses: z
    .array(z.string())
    .min(1, "Exam must target at least one class"),
  subjects: z
    .array(examSubjectDetailSchema)
    .min(1, "Exam must include at least one subject"),
  classroom: z.string().optional(),
});

export const otherEventSchema = baseScheduleEventSchema.extend({
  type: z.literal("OTHER"),
  label: z.string({ message: "Event label is required" }).min(2).trim(),
  targetClasses: z
    .array(z.string())
    .min(1, "Event must target at least one class"),
  location: z.string({ message: "Location is required" }),
});

export const scheduleEventSchema = z.discriminatedUnion("type", [
  courseEventSchema,
  examEventSchema,
  otherEventSchema,
]);

export const createTimetableSchema = z.object({
  body: z.object({
    title: z.string({ message: "Title is required" }).min(2).trim(),
    academicYear: z
      .string({ message: "Academic year is required" })
      .regex(/^\d{4}-\d{4}$/, "Academic year must follow YYYY-YYYY format"),
    events: z.array(scheduleEventSchema).default([]),
  }),
});

export const updateTimetableSchema = z.object({
  params: z.object({
    id: z.string({ message: "Timetable ID parameter is required" }),
  }),
  body: z.object({
    title: z.string().min(2).trim().optional(),
    academicYear: z
      .string()
      .regex(/^\d{4}-\d{4}$/)
      .optional(),
    events: z.array(scheduleEventSchema).optional(),
  }),
});

export type CreateTimetableDto = z.infer<typeof createTimetableSchema>["body"];
export type UpdateTimetableDto = z.infer<typeof updateTimetableSchema>["body"];
export type ScheduleEventDto = z.infer<typeof scheduleEventSchema>;
