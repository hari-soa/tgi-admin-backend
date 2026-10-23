import { z } from "zod";

export const studentHistoryTypeEnum = [
  "ABSENCE",
  "LATENESS",
  "SUSPENSION",
  "INFIRMARY",
  "EARLY_LEAVE_PERMIT",
] as const;

export const createStudentHistoryRecordSchema = z.object({
  body: z.object({
    studentId: z.string({ message: "Student ID is required" }),
    type: z.enum(studentHistoryTypeEnum, {
      message: "Invalid student history type",
    }),
    startDate: z.coerce.date({ message: "Invalid or missing start date" }),
    endDate: z.coerce.date({ message: "Invalid or missing end date" }),
    reason: z
      .string({ message: "Reason is required" })
      .min(3, "Reason must be at least 3 characters long")
      .trim(),
  }),
});

export const updateStudentHistoryRecordSchema = z.object({
  params: z.object({
    id: z.string({ message: "Record ID parameter is required" }),
  }),
  body: z.object({
    type: z.enum(studentHistoryTypeEnum).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    reason: z.string().min(3).trim().optional(),
  }),
});

export type CreateStudentHistoryRecordDto = z.infer<
  typeof createStudentHistoryRecordSchema
>["body"];
export type UpdateStudentHistoryRecordDto = z.infer<
  typeof updateStudentHistoryRecordSchema
>["body"];
