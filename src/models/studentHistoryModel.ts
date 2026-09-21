export enum StudentHistoryType {
  ABSENCE = "ABSENCE",
  LATENESS = "LATENESS",
  SUSPENSION = "SUSPENSION",
  INFIRMARY = "INFIRMARY",
  EARLY_LEAVE_PERMIT = "EARLY_LEAVE_PERMIT",
}

export interface StudentHistoryRecord {
  id: string;
  studentId: string;
  type: StudentHistoryType;
  startDate: Date;
  endDate: Date;
  reason: string;
  createdByAdminId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
