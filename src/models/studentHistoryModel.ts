export type StudentHistoryType =
  | "ABSENCE"
  | "LATENESS"
  | "SUSPENSION"
  | "INFIRMARY"
  | "EARLY_LEAVE_PERMIT";

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
