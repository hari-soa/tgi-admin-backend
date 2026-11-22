export enum ResultStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
}

export enum AcademicDecision {
  PROMOTE = "PROMOTE",
  REPEAT = "REPEAT",
  ORIENTED = "ORIENTED",
  PENDING = "PENDING",
}

export interface SubjectGradeBreakdown {
  subjectId: string;
  subjectName?: string;
  coefficient: number;
  term1SemiTrimesterGrade?: number | null;
  term1TrimesterGrade?: number | null;
  term2SemiTrimesterGrade?: number | null;
  term2TrimesterGrade?: number | null;
  term3SemiTrimesterGrade?: number | null;
  term3TrimesterGrade?: number | null;
  subjectOverallAverage: number | null;
}

export type SubjectGradeField = Exclude<
  keyof SubjectGradeBreakdown,
  "subjectId" | "subjectName" | "coefficient" | "subjectOverallAverage"
>;

export interface AnnualResult {
  id: string;
  studentId: string;
  classGroup: string;
  academicYear: string;
  status: ResultStatus;
  subjects: SubjectGradeBreakdown[];
  totalCoefficients: number;
  overallAverage: number;
  decision: AcademicDecision;
  classRank?: number;
  createdBySecretaryId: string;
  approvedByAdminId?: string;
  pdfExportUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
