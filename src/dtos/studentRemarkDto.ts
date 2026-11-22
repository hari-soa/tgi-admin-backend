export type RemarkCategoryValue =
  | "BEHAVIOR"
  | "ACADEMIC"
  | "WARNING"
  | "ENCOURAGEMENT"
  | "OTHER";

export interface CreateStudentRemarkDto {
  studentId: string;
  category: RemarkCategoryValue;
  content: string;
}

export interface UpdateStudentRemarkDto {
  category?: RemarkCategoryValue;
  content?: string;
}
