import { z } from "zod";

export const resultStatusEnum = ["DRAFT", "APPROVED", "PUBLISHED"] as const;
export const academicDecisionEnum = ["PASS", "FAIL", "PENDING"] as const;

export const subjectGradeBreakdownSchema = z.object({
  subjectId: z.string({ message: "Subject ID is required" }),
  subjectName: z.string().optional(),
  coefficient: z
    .number({ message: "Coefficient is required" })
    .positive("Coefficient must be greater than 0"),
  term1SemiTrimesterGrade: z.number().min(0).optional(),
  term1TrimesterGrade: z.number().min(0).optional(),
  term2SemiTrimesterGrade: z.number().min(0).optional(),
  term2TrimesterGrade: z.number().min(0).optional(),
  term3SemiTrimesterGrade: z.number().min(0).optional(),
  term3TrimesterGrade: z.number().min(0).optional(),
  subjectOverallAverage: z
    .number({ message: "Subject overall average is required" })
    .min(0, "Average cannot be negative"),
});

export const createAnnualResultSchema = z.object({
  body: z.object({
    studentId: z.string({ message: "Student ID is required" }),
    classGroup: z.string({ message: "Class group is required" }),
    academicYear: z
      .string({ message: "Academic year is required" })
      .regex(/^\d{4}-\d{4}$/, "Academic year must follow YYYY-YYYY format"),
    status: z.enum(resultStatusEnum).default("DRAFT"),
    subjects: z
      .array(subjectGradeBreakdownSchema)
      .min(1, "Result must contain breakdown for at least one subject"),
    totalCoefficients: z
      .number({ message: "Total coefficients is required" })
      .positive(),
    overallAverage: z
      .number({ message: "Overall average is required" })
      .min(0, "Average cannot be negative"),
    decision: z.enum(academicDecisionEnum).default("PENDING"),
    classRank: z.number().int().positive().optional(),
    pdfExportUrl: z.string().url({ message: "Invalid URL format" }).optional(),
  }),
});

export const updateAnnualResultSchema = z.object({
  params: z.object({
    id: z.string({ message: "Annual Result ID parameter is required" }),
  }),
  body: z.object({
    status: z.enum(resultStatusEnum).optional(),
    subjects: z.array(subjectGradeBreakdownSchema).optional(),
    totalCoefficients: z.number().positive().optional(),
    overallAverage: z.number().min(0).optional(),
    decision: z.enum(academicDecisionEnum).optional(),
    classRank: z.number().int().positive().optional(),
    pdfExportUrl: z.string().url().optional(),
  }),
});

export type CreateAnnualResultDto = z.infer<
  typeof createAnnualResultSchema
>["body"];
export type UpdateAnnualResultDto = z.infer<
  typeof updateAnnualResultSchema
>["body"];
