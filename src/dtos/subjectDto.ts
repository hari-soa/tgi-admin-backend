import { z } from "zod";
import { classGroupEnum } from "./studentDto";

export const classAssignmentSchema = z.object({
  classGroup: z.enum(classGroupEnum, { message: "Invalid class group" }),
  teacherId: z.string({
    message: "Teacher ID is required for each targeted class",
  }),
});

export const createSubjectSchema = z.object({
  body: z.object({
    name: z
      .string({ message: "Subject name is required" })
      .min(2, "Subject name must be at least 2 characters long")
      .trim(),
    coefficient: z
      .number({ message: "Coefficient is required" })
      .positive("Coefficient must be greater than 0"),
    description: z.string().optional(),
    assignments: z
      .array(classAssignmentSchema)
      .min(
        1,
        "Subject must target at least one class with an assigned teacher",
      ),
  }),
});

export const updateSubjectSchema = z.object({
  params: z.object({
    id: z.string({ message: "Subject ID parameter is required" }),
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    coefficient: z.number().positive().optional(),
    description: z.string().optional(),
    assignments: z.array(classAssignmentSchema).min(1).optional(),
  }),
});

export type CreateSubjectDto = z.infer<typeof createSubjectSchema>["body"];
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>["body"];
