import { z } from "zod";
import { classGroupEnum } from "./studentDto";

export const createTeacherSchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    password: z.string({ message: "Password is required" }).min(8),
    contactNumber: z.string({ message: "Contact number is required" }),
    email: z
      .string()
      .email("Invalid email address format")
      .trim()
      .toLowerCase()
      .optional(),
    profilePictureUrl: z.string().url().optional(),
    subjectIds: z
      .array(z.string())
      .min(1, "Teacher must be assigned to at least one subject"),
    homeroomClass: z.enum(classGroupEnum).optional(),
  }),
});

export const updateTeacherSchema = z.object({
  params: z.object({
    id: z.string({ message: "Teacher ID parameter is required" }),
  }),
  body: z.object({
    firstName: z.string().min(2).trim().optional(),
    lastName: z.string().min(2).trim().optional(),
    password: z.string().min(8).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    subjectIds: z.array(z.string()).optional(),
    homeroomClass: z.enum(classGroupEnum).optional(),
  }),
});

export type CreateTeacherDto = z.infer<typeof createTeacherSchema>["body"];
export type UpdateTeacherDto = z.infer<typeof updateTeacherSchema>["body"];
