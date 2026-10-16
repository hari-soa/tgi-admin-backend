export interface EventEntity {
  id: string;
  type: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  targetClasses: string[];
  createdByAdminId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
