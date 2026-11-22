import { ClassGroup } from "./userDto";

export type ResultStatusValue = "DRAFT" | "APPROVED" | "PUBLISHED";
export type AcademicDecisionValue = "PROMOTE" | "REPEAT" | "ORIENTED" | "PENDING";

export interface SubjectGradeBreakdownDto {
  subjectId: string;
  subjectName: string;
  coefficient: number;
  term1SemiTrimesterGrade?: number | null;
  term1TrimesterGrade?: number | null;
  term2SemiTrimesterGrade?: number | null;
  term2TrimesterGrade?: number | null;
  term3SemiTrimesterGrade?: number | null;
  term3TrimesterGrade?: number | null;
  subjectOverallAverage?: number | null;
}

export interface CreateAnnualResultDto {
  studentId: string;
  classGroup: ClassGroup;
  academicYear: string;
  status: ResultStatusValue;
  subjects: SubjectGradeBreakdownDto[];
  totalCoefficients: number;
  overallAverage: number;
  decision: AcademicDecisionValue;
  classRank?: number;
}

export interface ReviewAnnualResultDto {
  status?: ResultStatusValue;
  decision?: AcademicDecisionValue;
}
