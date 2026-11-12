import { z } from "zod";
import { classGroupEnum, genderEnum } from "./studentDto";

export const createTeacherSchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    matricule: z.string({ message: "Matricule is required" }).min(2).trim(),
    gender: z.enum(genderEnum, { message: "Invalid gender option" }),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    subjectIds: z.array(z.string()).optional(),
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
    matricule: z.string().min(2).trim().optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    homeroomClass: z.enum(classGroupEnum).optional(),
  }),
});

export type CreateTeacherDto = z.infer<typeof createTeacherSchema>["body"];
export type UpdateTeacherDto = z.infer<typeof updateTeacherSchema>["body"];
