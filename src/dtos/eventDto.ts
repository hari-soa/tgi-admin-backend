import { z } from "zod";
import { classGroupEnum } from "./studentDto";

export const createEventSchema = z.object({
  body: z.object({
    type: z.string({ message: "Event type is required" }).min(2).trim(),
    title: z.string({ message: "Event title is required" }).min(2).trim(),
    description: z.string().optional(),
    startTime: z.coerce.date({ message: "Invalid or missing start time" }),
    endTime: z.coerce.date({ message: "Invalid or missing end time" }),
    location: z.string().optional(),
    targetClasses: z
      .array(z.enum(classGroupEnum))
      .min(1, "Event must target at least one class"),
  }),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: z.string({ message: "Event ID parameter is required" }),
  }),
  body: z.object({
    type: z.string().min(2).trim().optional(),
    title: z.string().min(2).trim().optional(),
    description: z.string().optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    location: z.string().optional(),
    targetClasses: z.array(z.enum(classGroupEnum)).min(1).optional(),
  }),
});

export type CreateEventDto = z.infer<typeof createEventSchema>["body"];
export type UpdateEventDto = z.infer<typeof updateEventSchema>["body"];
