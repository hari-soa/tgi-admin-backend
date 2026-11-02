import { z } from "zod";
import { genderEnum } from "./studentDto";

export const createSecretarySchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    matricule: z.string({ message: "Matricule is required" }).min(2).trim(),
    gender: z.enum(genderEnum, { message: "Invalid gender option" }),
    password: z.string().min(8).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    department: z.string().optional(),
  }),
});

export const updateSecretarySchema = z.object({
  params: z.object({
    id: z.string({ message: "Secretary ID parameter is required" }),
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
    department: z.string().optional(),
  }),
});

export type CreateSecretaryDto = z.infer<typeof createSecretarySchema>["body"];
export type UpdateSecretaryDto = z.infer<typeof updateSecretarySchema>["body"];
