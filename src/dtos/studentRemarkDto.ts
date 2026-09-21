import { z } from "zod";

export const remarkCategoryEnum = [
  "BEHAVIOR",
  "ACADEMIC",
  "WARNING",
  "ENCOURAGEMENT",
  "OTHER",
] as const;

export const createStudentRemarkSchema = z.object({
  body: z.object({
    studentId: z.string({ message: "Student ID is required" }),
    authorId: z.string({ message: "Author ID is required" }),
    authorRole: z.string({ message: "Author role is required" }),
    category: z.enum(remarkCategoryEnum, {
      message: "Invalid remark category",
    }),
    content: z
      .string({ message: "Remark content is required" })
      .min(5, "Remark content must be at least 5 characters long")
      .trim(),
  }),
});

export const updateStudentRemarkSchema = z.object({
  params: z.object({
    id: z.string({ message: "Remark ID parameter is required" }),
  }),
  body: z.object({
    category: z.enum(remarkCategoryEnum).optional(),
    content: z.string().min(5).trim().optional(),
  }),
});

export type CreateStudentRemarkDto = z.infer<
  typeof createStudentRemarkSchema
>["body"];

export type UpdateStudentRemarkDto = z.infer<
  typeof updateStudentRemarkSchema
>["body"];
