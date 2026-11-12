import { z } from "zod";

export type UserRole = "ADMIN" | "TEACHER" | "SECRETARY" | "STUDENT";
export type ClassGroup = "SECONDE" | "PREMIERE" | "TERMINALE" | "ANCIEN";
export type Gender = "MALE" | "FEMALE";
export const classGroupEnum = [
  "SECONDE",
  "PREMIERE",
  "TERMINALE",
  "ANCIEN",
] as const;
export const genderEnum = ["MALE", "FEMALE"] as const;

export const createAdministratorSchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    matricule: z.string({ message: "Matricule is required" }).min(2).trim(),
    gender: z.enum(genderEnum, { message: "Invalid gender option" }),
    contactNumber: z.string().optional(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().url().optional(),
    role: z.string().optional(),
  }),
});

export const createStudentSchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    matricule: z.string({ message: "Matricule is required" }).min(2).trim(),
    gender: z.enum(genderEnum, { message: "Invalid gender option" }),
    classRollNumber: z
      .number({ message: "Class roll number is required" })
      .int()
      .positive(),
    classGroup: z.enum(classGroupEnum, {
      message: "Invalid class group option",
    }),
    contactNumber: z.string().optional(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().url().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    parentsEmail: z.string().email().optional(),
    parentsContactNumber: z.string().optional(),
    entryYear: z.number().int().optional(),
    graduationYear: z.number().int().optional(),
    comments: z.string().optional(),
  }),
});

export const createSecretarySchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    matricule: z.string({ message: "Matricule is required" }).min(2).trim(),
    gender: z.enum(genderEnum, { message: "Invalid gender option" }),
    contactNumber: z.string().optional(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().url().optional(),
    department: z.string().optional(),
  }),
});

export const createTeacherSchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    matricule: z.string({ message: "Matricule is required" }).min(2).trim(),
    contactNumber: z.string().optional(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    homeroomClass: z.enum(classGroupEnum).optional(),
  }),
});

export type CreateAdministratorDto = z.infer<
  typeof createAdministratorSchema
>["body"];
export type CreateStudentDto = z.infer<typeof createStudentSchema>["body"];
export type CreateSecretaryDto = z.infer<typeof createSecretarySchema>["body"];
export type CreateTeacherDto = z.infer<typeof createTeacherSchema>["body"];
