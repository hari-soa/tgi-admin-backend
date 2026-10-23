export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export interface TeacherAttendanceSlot {
  id: string;
  teacherId: string;
  subjectId: string;
  targetClass: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  classroom: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeacherAttendance {
  id: string;
  slotId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  actualCheckInTime?: Date;
  lateDurationMinutes: number;
  motif?: string;
  recordedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceCardView {
  slotId: string;
  attendanceId?: string;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
  subjectId: string;
  subjectName: string;
  targetClass: string;
  classroom: string;
  startTime: string;
  endTime: string;
  attendanceDate: string;
  status: AttendanceStatus | "PENDING";
  actualCheckInTime?: Date;
  lateDurationMinutes: number;
  motif?: string;
}

export interface AttendanceMotifDetail {
  attendanceDate: string;
  motif: string;
}

export interface AttendanceSummaryCard {
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
  subjectId: string;
  subjectName: string;
  targetClass: string;
  status: AttendanceStatus;
  occurrenceCount: number;
  totalLateMinutes: number;
  motifs: AttendanceMotifDetail[];
}
