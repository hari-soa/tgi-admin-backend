export type StudentHistoryTypeValue =
  | "ABSENCE"
  | "LATENESS"
  | "SUSPENSION"
  | "INFIRMARY"
  | "EARLY_LEAVE_PERMIT";

export interface CreateStudentHistoryRecordDto {
  studentId: string;
  type: StudentHistoryTypeValue;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateStudentHistoryRecordDto {
  type?: StudentHistoryTypeValue;
  startDate?: string;
  endDate?: string;
  reason?: string;
}
