export enum RemarkCategory {
  BEHAVIOR = "BEHAVIOR",
  ACADEMIC = "ACADEMIC",
  WARNING = "WARNING",
  ENCOURAGEMENT = "ENCOURAGEMENT",
  OTHER = "OTHER",
}

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
