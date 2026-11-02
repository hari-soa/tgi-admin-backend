import { z } from "zod";
import { genderEnum } from "./studentDto";

export const createAdministratorSchema = z.object({
  body: z.object({
    firstName: z.string({ message: "First name is required" }).min(2).trim(),
    lastName: z.string({ message: "Last name is required" }).min(2).trim(),
    matricule: z.string({ message: "Matricule is required" }).min(2).trim(),
    gender: z.enum(genderEnum, { message: "Invalid gender option" }),
    password: z.string().min(8).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    role: z.string().optional(),
  }),
});

export const updateAdministratorSchema = z.object({
  params: z.object({
    id: z.string({ message: "Administrator ID parameter is required" }),
  }),
  body: z.object({
    firstName: z.string().min(2).trim().optional(),
    lastName: z.string().min(2).trim().optional(),
    matricule: z.string().min(2).trim().optional(),
    password: z.string().min(8).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    role: z.string().optional(),
  }),
});

export type CreateAdministratorDto = z.infer<
  typeof createAdministratorSchema
>["body"];
export type UpdateAdministratorDto = z.infer<
  typeof updateAdministratorSchema
>["body"];
