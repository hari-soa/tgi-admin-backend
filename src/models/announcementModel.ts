export enum TargetScope {
  ALL = "ALL",
  CLASS = "CLASS",
}

export enum AnnouncementPriority {
  NORMAL = "NORMAL",
  URGENT = "URGENT",
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetScope: TargetScope;
  targetValue?: string;
  priority: AnnouncementPriority;
  createdAt: Date;
  updatedAt?: Date;
}
