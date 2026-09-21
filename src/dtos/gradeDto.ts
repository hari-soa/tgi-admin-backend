import { z } from "zod";

export const createGradeSchema = z.object({
  body: z.object({
    studentId: z.string({ message: "Student ID is required" }),
    subjectId: z.string({ message: "Subject ID is required" }),
    teacherId: z.string({ message: "Teacher ID is required" }),
    period: z
      .number()
      .int()
      .min(1)
      .max(6, { message: "Period must be between 1 and 6" }),
    score: z
      .number({ message: "Score must be a number" })
      .min(0, "Score cannot be negative")
      .max(20, "Score cannot exceed 20"),
    coefficient: z.number().positive().default(1),
    remarks: z.string().optional(),
  }),
});

export const updateGradeSchema = z.object({
  params: z.object({
    id: z.string({ message: "Grade ID parameter is required" }),
  }),
  body: z.object({
    score: z.number().min(0).max(20).optional(),
    coefficient: z.number().positive().optional(),
    remarks: z.string().optional(),
  }),
});

export type CreateGradeDto = z.infer<typeof createGradeSchema>["body"];
export type UpdateGradeDto = z.infer<typeof updateGradeSchema>["body"];
