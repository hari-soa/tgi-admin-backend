import { z } from "zod";

export type UserRole = "ADMIN" | "TEACHER" | "SECRETARY" | "STUDENT";
export type ClassGroup = "SECONDE" | "PREMIERE" | "TERMINALE" | "ANCIEN";
export type Gender = "MALE" | "FEMALE";
export const classGroupEnum = ["SECONDE", "PREMIERE", "TERMINALE"] as const;

export const createAdministratorSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    contactNumber: z.string().min(5, "Contact number is required"),
    email: z.string().email("Invalid email format").optional(),
    profilePictureUrl: z.string().url().optional(),
  }),
});

export const createStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    password: z.string().min(8),
    contactNumber: z.string(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().url().optional(),
    classRollNumber: z.number().min(1),
    classGroup: z.enum(classGroupEnum),
    dateOfBirth: z.string(),
    gender: z.enum(["MALE", "FEMALE"]),
    address: z.string(),
    parentsEmail: z.string().email(),
    parentsContactNumber: z.string(),
    entryYear: z.number().int().min(2000),
    graduationYear: z.number().int().optional(),
    comments: z.string().optional(),
  }),
});

export const createSecretarySchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    password: z.string().min(8),
    contactNumber: z.string(),
    email: z.string().email().optional(),
    profilePictureUrl: z.string().url().optional(),
    department: z.string().optional(),
  }),
});

export const createTeacherSchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
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

export type CreateAdministratorDto = z.infer<
  typeof createAdministratorSchema
>["body"];
export type CreateStudentDto = z.infer<typeof createStudentSchema>["body"];
export type CreateSecretaryDto = z.infer<typeof createSecretarySchema>["body"];
export type CreateTeacherDto = z.infer<typeof createTeacherSchema>["body"];
