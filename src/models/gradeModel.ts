export enum ExamType {
  SEMI_TRIMESTER = "SEMI_TRIMESTER",
  TRIMESTER = "TRIMESTER",
}

export enum Term {
  FIRST_TRIMESTER = 1,
  SECOND_TRIMESTER = 2,
  THIRD_TRIMESTER = 3,
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

export interface TermSubjectGrades {
  subjectId: string;
  term: Term;
  semiTrimesterGrade?: Grade;
  trimesterGrade?: Grade;
}
