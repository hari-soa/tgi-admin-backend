import { z } from "zod";
import { classGroupEnum } from "./studentDto";

export const examTypeEnum = ["SEMI_TRIMESTER", "TRIMESTER"] as const;
export const termEnum = [
  "FIRST_TRIMESTER",
  "SECOND_TRIMESTER",
  "THIRD_TRIMESTER",
] as const;
export const gradeStatusEnum = ["DRAFT", "PENDING", "PUBLISHED"] as const;

const valueIsWithinMaxScore = (grade: {
  value?: number;
  maxScore?: number;
}): boolean =>
  grade.value === undefined ||
  grade.maxScore === undefined ||
  grade.value <= grade.maxScore;

const VALUE_ABOVE_MAX_MESSAGE = {
  message: "Grade value cannot exceed the max score",
  path: ["value"],
};

const sessionGradeSchema = z
  .object({
    studentId: z.string({ message: "Student ID is required" }),
    value: z.number({ message: "Grade value must be a number" }).min(0),
    maxScore: z.number().positive().default(20),
  })
  .refine(valueIsWithinMaxScore, VALUE_ABOVE_MAX_MESSAGE);

export const createGradeSchema = z.object({
  body: z
    .object({
      studentId: z.string({ message: "Student ID is required" }),
      subjectId: z.string({ message: "Subject ID is required" }),
      classGroup: z.enum(classGroupEnum, { message: "Invalid class group" }),
      examType: z.enum(examTypeEnum, { message: "Invalid exam type" }),
      term: z.enum(termEnum, { message: "Invalid term" }),
      value: z
        .number({ message: "Grade value must be a number" })
        .min(0, "Grade value cannot be negative"),
      maxScore: z
        .number()
        .positive("Max score must be greater than 0")
        .default(20),
      evaluationDate: z.coerce.date({
        message: "Invalid or missing evaluation date",
      }),
    })
    .refine(valueIsWithinMaxScore, VALUE_ABOVE_MAX_MESSAGE),
});

export const updateGradeSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    value: z.number().min(0).optional(),
    maxScore: z.number().positive().optional(),
    evaluationDate: z.coerce.date().optional(),
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

export const createGradeSessionSchema = z.object({
  body: z.object({
    classGroup: z.enum(classGroupEnum, { message: "Invalid class group" }),
    subjectId: z.string({ message: "Subject ID is required" }),
    examType: z.enum(examTypeEnum, { message: "Invalid exam type" }),
    term: z.enum(termEnum, { message: "Invalid term" }),
  }),
});

export const saveGradeSessionDraftSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ grades: z.array(sessionGradeSchema) }),
});

export const submitGradeSessionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    grades: z
      .array(sessionGradeSchema)
      .min(1, "At least one grade is required"),
  }),
});

export type CreateGradeDto = z.infer<typeof createGradeSchema>["body"];
export type UpdateGradeDto = z.infer<typeof updateGradeSchema>["body"];
export type CreateGradeSessionDto = z.infer<
  typeof createGradeSessionSchema
>["body"];
export type SessionGradeDto = z.infer<typeof sessionGradeSchema>;
