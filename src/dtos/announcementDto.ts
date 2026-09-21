import { z } from "zod";

export const announcementAudience = [
  "ALL",
  "STUDENTS",
  "TEACHERS",
  "CLASS",
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
    targetAudience: z.enum(announcementAudience, {
      message: "Invalid target audience",
    }),
    targetClassId: z.string().optional(),
    authorId: z.string({ message: "Author ID is required" }),
  }),
});

export type CreateAnnouncementDto = z.infer<
  typeof createAnnouncementSchema
>["body"];
