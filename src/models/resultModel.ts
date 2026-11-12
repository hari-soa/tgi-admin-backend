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
  term1SemiTrimesterGrade?: number;
  term1TrimesterGrade?: number;
  term2SemiTrimesterGrade?: number;
  term2TrimesterGrade?: number;
  term3SemiTrimesterGrade?: number;
  term3TrimesterGrade?: number;
  subjectOverallAverage: number;
}

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
