import { z } from "zod";
import { classGroupEnum } from "./studentDto";

export const targetScopeEnum = ["ALL", "CLASS"] as const;
export const announcementPriorityEnum = ["NORMAL", "URGENT"] as const;

const classScopeRequiresClasses = (body: {
  targetScope?: string;
  targetClasses?: string[];
}): boolean =>
  body.targetScope !== "CLASS" ||
  (body.targetClasses !== undefined && body.targetClasses.length > 0);

const CLASS_SCOPE_MESSAGE = {
  message: "At least one target class is required when the scope is CLASS",
  path: ["targetClasses"],
};

export const createAnnouncementSchema = z.object({
  body: z
    .object({
      title: z
        .string({ message: "Title is required" })
        .min(3, "Title must be at least 3 characters long")
        .trim(),
      content: z
        .string({ message: "Content is required" })
        .min(10, "Content must be at least 10 characters long"),
      targetScope: z.enum(targetScopeEnum, { message: "Invalid target scope" }),
      targetValue: z.string().optional().nullable(),
      priority: z
        .enum(announcementPriorityEnum, { message: "Invalid priority level" })
        .default("NORMAL"),
      targetClasses: z.array(z.enum(classGroupEnum)).optional(),
    })
    .refine(classScopeRequiresClasses, CLASS_SCOPE_MESSAGE),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({
    id: z.string({ message: "Announcement ID parameter is required" }),
  }),
  body: z
    .object({
      title: z.string().min(3).trim().optional(),
      content: z.string().min(10).optional(),
      targetScope: z.enum(targetScopeEnum).optional(),
      targetValue: z.string().optional().nullable(),
      priority: z.enum(announcementPriorityEnum).optional(),
      targetClasses: z.array(z.enum(classGroupEnum)).optional(),
    })
    .refine(classScopeRequiresClasses, CLASS_SCOPE_MESSAGE),
});

export type CreateAnnouncementDto = z.infer<
  typeof createAnnouncementSchema
>["body"];
export type UpdateAnnouncementDto = z.infer<
  typeof updateAnnouncementSchema
>["body"];
