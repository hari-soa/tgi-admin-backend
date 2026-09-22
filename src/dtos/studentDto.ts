import { z } from "zod";

export const genderEnum = ["MALE", "FEMALE", "OTHER"] as const;
export const classGroupEnum = ["SECONDE", "PREMIERE", "TERMINALE"] as const;

export const createStudentSchema = z.object({
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
    classRollNumber: z
      .number({ message: "Class roll number is required" })
      .int()
      .positive(),
    classGroup: z.enum(classGroupEnum, {
      message: "Invalid class group option",
    }),
    dateOfBirth: z
      .string({ message: "Date of birth is required" })
      .datetime()
      .or(z.date()),
    gender: z.enum(genderEnum, { message: "Invalid gender option" }),
    address: z.string({ message: "Address is required" }),
    parentsEmail: z
      .string({ message: "Parents email is required" })
      .email()
      .trim()
      .toLowerCase(),
    parentsContactNumber: z.string({
      message: "Parents contact number is required",
    }),
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
    password: z.string().min(8).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    classRollNumber: z.number().int().positive().optional(),
    classGroup: z.enum(classGroupEnum).optional(),
    dateOfBirth: z.string().datetime().or(z.date()).optional(),
    gender: z.enum(genderEnum).optional(),
    address: z.string().optional(),
    parentsEmail: z.string().email().trim().toLowerCase().optional(),
    parentsContactNumber: z.string().optional(),
    comments: z.string().optional(),
  }),
});

export type CreateStudentDto = z.infer<typeof createStudentSchema>["body"];
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>["body"];
