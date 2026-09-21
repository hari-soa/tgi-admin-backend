import { z } from "zod";

export const createSecretarySchema = z.object({
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
    password: z.string().min(8).optional(),
    contactNumber: z.string().optional(),
    email: z.string().email().trim().toLowerCase().optional(),
    profilePictureUrl: z.string().url().optional(),
    department: z.string().optional(),
  }),
});

export type CreateSecretaryDto = z.infer<typeof createSecretarySchema>["body"];
export type UpdateSecretaryDto = z.infer<typeof updateSecretarySchema>["body"];
