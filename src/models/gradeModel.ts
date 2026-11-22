export type ExamType = "SEMI_TRIMESTER" | "TRIMESTER";

export type Term = "FIRST_TRIMESTER" | "SECOND_TRIMESTER" | "THIRD_TRIMESTER";

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  classGroup: string;
  createdBySecretaryId: string;
  examType: ExamType;
  term: Term;
  value: number;
  evaluationDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type GradeSessionStatus = "OPEN" | "PENDING_REVIEW" | "VALIDATED";

export interface GradeSessionEntry {
  studentId: string;
  value: number | null;
}

export interface GradeSessionAbsence {
  studentId: string;
  motif: string | null;
  recordedAt: Date;
}

export interface GradeSession {
  id: string;
  classGroup: string;
  subjectId: string;
  subjectName: string;
  subjectCoefficient: number;
  examType: ExamType;
  term: Term;
  academicYear: string;
  status: GradeSessionStatus;
  draftGrades: GradeSessionEntry[];
  absences: GradeSessionAbsence[];
  createdByAdminId: string;
  submittedBySecretaryId?: string;
  validatedByAdminId?: string;
  createdAt?: Date;
  submittedAt?: Date;
  validatedAt?: Date;
}
