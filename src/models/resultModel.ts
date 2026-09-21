import { Term } from "./gradeModel";

export enum ResultStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
}

export interface SubjectGradeBreakdown {
  subjectId: string;
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
  classRank?: number;
  createdBySecretaryId: string;
  approvedByAdminId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
