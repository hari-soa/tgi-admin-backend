import { z } from "zod";

export const userRoles = [
  "ADMINISTRATOR",
  "SECRETARY",
  "TEACHER",
  "STUDENT",
] as const;

export const createUserSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address format")
      .trim()
      .toLowerCase(),
    password: z
      .string({ message: "Password is required" })
      .min(8, "Password must be at least 8 characters long"),
    firstName: z
      .string({ message: "First name is required" })
      .min(2, "First name must be at least 2 characters")
      .trim(),
    lastName: z
      .string({ message: "Last name is required" })
      .min(2, "Last name must be at least 2 characters")
      .trim(),
    role: z.enum(userRoles, {
      message: "Invalid user role",
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string({ message: "User ID parameter is required" }),
  }),
  body: z.object({
    email: z
      .string()
      .email("Invalid email address format")
      .trim()
      .toLowerCase()
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .optional(),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .trim()
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .trim()
      .optional(),
    role: z.enum(userRoles).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address format")
      .trim()
      .toLowerCase(),
    password: z.string({ message: "Password is required" }),
  }),
});

export type CreateUserDto = z.infer<typeof createUserSchema>["body"];
export type UpdateUserDto = z.infer<typeof updateUserSchema>["body"];
export type LoginUserDto = z.infer<typeof loginUserSchema>["body"];
