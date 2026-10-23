export type RemarkCategory =
  | "BEHAVIOR"
  | "ACADEMIC"
  | "WARNING"
  | "ENCOURAGEMENT"
  | "OTHER";

export interface StudentRemark {
  id: string;
  studentId: string;
  authorId: string;
  authorRole: string;
  category: RemarkCategory;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}
