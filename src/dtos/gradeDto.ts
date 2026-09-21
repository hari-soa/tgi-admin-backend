import { z } from "zod";

export const examTypeEnum = ["SEMI_TRIMESTER", "TRIMESTER"] as const;
export const termEnum = [1, 2, 3] as const;

export const createGradeSchema = z.object({
  body: z.object({
    studentId: z.string({ message: "Student ID is required" }),
    subjectId: z.string({ message: "Subject ID is required" }),
    classGroup: z.string({ message: "Class group is required" }),
    createdBySecretaryId: z.string({ message: "Secretary ID is required" }),
    examType: z.enum(examTypeEnum, { message: "Invalid exam type" }),
    term: z.union([z.literal(1), z.literal(2), z.literal(3)], {
      message: "Term must be 1, 2, or 3",
    }),
    value: z
      .number({ message: "Grade value must be a number" })
      .min(0, "Grade value cannot be negative"),
    maxScore: z
      .number({ message: "Max score is required" })
      .positive("Max score must be greater than 0")
      .default(20),
    evaluationDate: z.coerce.date({
      message: "Invalid or missing evaluation date",
    }),
  }),
});

export const updateGradeSchema = z.object({
  params: z.object({
    id: z.string({ message: "Grade ID parameter is required" }),
  }),
  body: z.object({
    value: z.number().min(0).optional(),
    maxScore: z.number().positive().optional(),
    examType: z.enum(examTypeEnum).optional(),
    term: z
      .number()
      .pipe(z.nativeEnum({ 1: 1, 2: 2, 3: 3 }))
      .optional(),
    evaluationDate: z.coerce.date().optional(),
  }),
});

export type CreateGradeDto = z.infer<typeof createGradeSchema>["body"];
export type UpdateGradeDto = z.infer<typeof updateGradeSchema>["body"];
