import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email address format")
      .trim()
      .toLowerCase(),
    matricule: z
      .string({ message: "Matricule is required" })
      .trim()
      .min(1, "Matricule cannot be empty"),
  }),
});

export type LoginDto = z.infer<typeof loginSchema>["body"];
