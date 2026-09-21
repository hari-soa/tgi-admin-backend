export enum RemarkCategory {
  BEHAVIOR = "BEHAVIOR",
  ACADEMIC = "ACADEMIC",
  WARNING = "WARNING",
  ENCOURAGEMENT = "ENCOURAGEMENT",
  OTHER = "OTHER",
}

export enum AuthorRole {
  TEACHER = "TEACHER",
  ADMINISTRATOR = "ADMINISTRATOR",
}

export interface StudentRemark {
  id: string;
  studentId: string;
  authorId: string;
  authorRole: AuthorRole;
  category: RemarkCategory;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}
