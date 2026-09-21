import { z } from "zod";

export const createAdministratorSchema = z.object({
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
    role: z.string({ message: "Role is required" }),
  }),
});

export type CreateAdministratorDto = z.infer<
  typeof createAdministratorSchema
>["body"];
