import { z } from "zod";
import { classGroupEnum } from "./studentDto";

export const examTypeEnum = ["SEMI_TRIMESTER", "TRIMESTER"] as const;
export const termEnum = [
  "FIRST_TRIMESTER",
  "SECOND_TRIMESTER",
  "THIRD_TRIMESTER",
] as const;
export const gradeStatusEnum = ["DRAFT", "PENDING", "PUBLISHED"] as const;

export const createGradeSchema = z.object({
  body: z.object({
    studentId: z.string({ message: "Student ID is required" }),
    subjectId: z.string({ message: "Subject ID is required" }),
    classGroup: z.enum(classGroupEnum, { message: "Invalid class group" }),
    examType: z.enum(examTypeEnum, { message: "Invalid exam type" }),
    term: z.enum(termEnum, { message: "Invalid term" }),
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

export const submitGradeSessionSchema = z.object({
  body: z.object({
    classGroup: z.enum(classGroupEnum, { message: "Invalid class group" }),
    subjectId: z.string({ message: "Subject ID is required" }),
    examType: z.enum(examTypeEnum, { message: "Invalid exam type" }),
    term: z.enum(termEnum, { message: "Invalid term" }),
    grades: z
      .array(
        z.object({
          studentId: z.string({ message: "Student ID is required" }),
          value: z.number().min(0),
          maxScore: z.number().positive().default(20),
        }),
      )
      .min(1, "At least one grade is required"),
  }),
});

export const reviewGradeSchema = z.object({
  params: z.object({
    id: z.string({ message: "Grade ID parameter is required" }),
  }),
  body: z.object({
    status: z.enum(gradeStatusEnum, { message: "Invalid status" }),
  }),
});

export type CreateGradeDto = z.infer<typeof createGradeSchema>["body"];
export type SubmitGradeSessionDto = z.infer<
  typeof submitGradeSessionSchema
>["body"];
export type ReviewGradeDto = z.infer<typeof reviewGradeSchema>["body"];
