import { z } from "zod";

export const genderEnum = ["MALE", "FEMALE"] as const;
export const classGroupEnum = [
  "SECONDE",
  "PREMIERE",
  "TERMINALE",
  "ANCIEN",
] as const;

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
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    parentsEmail: z.string().email().trim().toLowerCase().optional(),
    parentsContactNumber: z.string().optional(),
    entryYear: z.number().int().optional(),
    graduationYear: z.number().int().optional(),
    comments: z.string().optional(),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({
    id: z.string({ message: "Student ID parameter is required" }),
  }),
  body: z.object({
    firstName: z.string().min(2).trim().optional(),
    lastName: z.string().min(2).trim().optional(),
    matricule: z.string().min(2).trim().optional(),
    password: z.string().min(8).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    classRollNumber: z.number().int().positive().optional(),
    classGroup: z.enum(classGroupEnum).optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    parentsEmail: z.string().email().trim().toLowerCase().optional(),
    parentsContactNumber: z.string().optional(),
    comments: z.string().optional(),
    graduationYear: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>["body"];
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>["body"];
