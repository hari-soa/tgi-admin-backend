import { ClassGroup } from "./userDto";

export type ExamTypeValue = "SEMI_TRIMESTER" | "TRIMESTER";
export type TermValue = "FIRST_TRIMESTER" | "SECOND_TRIMESTER" | "THIRD_TRIMESTER";
export type GradeStatusValue = "DRAFT" | "PENDING" | "PUBLISHED";

export const MAX_GRADE = 20;

export interface CreateGradeDto {
  studentId: string;
  subjectId: string;
  classGroup: ClassGroup;
  examType: ExamTypeValue;
  term: TermValue;
  value: number;
  evaluationDate: string;
}

export interface UpdateGradeDto {
  value?: number;
  evaluationDate?: string;
}

export interface ReviewGradeDto {
  status: GradeStatusValue;
}

export interface CreateGradeSessionDto {
  classGroup: ClassGroup;
  subjectId: string;
  examType: ExamTypeValue;
  term: TermValue;
}

export interface SessionGradeDto {
  studentId: string;
  value?: number | null;
}

export interface SaveGradeSessionDto {
  grades: SessionGradeDto[];
}

export interface AbsenceMotifDto {
  studentId: string;
  motif: string;
}

export interface ReviseGradeSessionDto extends SaveGradeSessionDto {
  absences?: AbsenceMotifDto[];
}
