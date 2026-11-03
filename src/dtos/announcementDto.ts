import { z } from "zod";

export const targetScopeEnum = ["ALL", "CLASS"] as const;
export const announcementPriorityEnum = ["NORMAL", "URGENT"] as const;
export const classGroupEnum = [
  "SECONDE",
  "PREMIERE",
  "TERMINALE",
  "ANCIEN",
] as const;

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z
      .string({ message: "Title is required" })
      .min(3, "Title must be at least 3 characters long")
      .trim(),
    content: z
      .string({ message: "Content is required" })
      .min(10, "Content must be at least 10 characters long"),
    targetScope: z.enum(targetScopeEnum, {
      message: "Invalid target scope",
    }),
    targetValue: z.string().optional().nullable(),
    priority: z
      .enum(announcementPriorityEnum, {
        message: "Invalid priority level",
      })
      .default("NORMAL"),
    targetClasses: z.array(z.enum(classGroupEnum)).optional(),
  }),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({
    id: z.string({ message: "Announcement ID parameter is required" }),
  }),
  body: z.object({
    title: z.string().min(3).trim().optional(),
    content: z.string().min(10).optional(),
    targetScope: z.enum(targetScopeEnum).optional(),
    targetValue: z.string().optional(),
    priority: z.enum(announcementPriorityEnum).optional(),
    targetClasses: z.array(z.enum(classGroupEnum)).optional(),
  }),
});

export type CreateAnnouncementDto = z.infer<
  typeof createAnnouncementSchema
>["body"];
export type UpdateAnnouncementDto = z.infer<
  typeof updateAnnouncementSchema
>["body"];
