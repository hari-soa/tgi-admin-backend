import { z } from "zod";

export const userRoles = [
  "ADMINISTRATOR",
  "SECRETARY",
  "TEACHER",
  "STUDENT",
] as const;

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

export const updatePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ message: "Current password is required" }),
    newPassword: z
      .string({ message: "New password is required" })
      .min(8, "Password must be at least 8 characters long"),
  }),
});

export type LoginUserDto = z.infer<typeof loginUserSchema>["body"];
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>["body"];
