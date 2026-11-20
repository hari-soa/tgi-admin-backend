export enum ExamType {
  SEMI_TRIMESTER = "SEMI_TRIMESTER",
  TRIMESTER = "TRIMESTER",
}

export enum Term {
  FIRST_TRIMESTER = "FIRST_TRIMESTER",
  SECOND_TRIMESTER = "SECOND_TRIMESTER",
  THIRD_TRIMESTER = "THIRD_TRIMESTER",
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classGroup: string;
  createdBySecretaryId: string;
  examType: ExamType;
  term: Term;
  value: number;
  maxScore: number;
  evaluationDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GradeSessionStatus = "OPEN" | "PENDING_REVIEW" | "VALIDATED";

export interface GradeSessionEntry {
  studentId: string;
  value: number;
  maxScore: number;
}

export interface GradeSession {
  id: string;
  classGroup: string;
  subjectId: string;
  subjectName: string;
  examType: ExamType;
  term: Term;
  academicYear: string;
  status: GradeSessionStatus;
  draftGrades: GradeSessionEntry[];
  createdByAdminId: string;
  submittedBySecretaryId?: string;
  validatedByAdminId?: string;
  createdAt?: Date;
  submittedAt?: Date;
  validatedAt?: Date;
}
