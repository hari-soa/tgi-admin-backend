export enum EventType {
  COURSE = "COURSE",
  EXAM = "EXAM",
  OTHER = "OTHER",
}

export interface BaseScheduleEvent {
  id: string;
  type: EventType;
  startTime: Date;
  endTime: Date;
  createdByAdminId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseEvent extends BaseScheduleEvent {
  type: EventType.COURSE;
  subjectId: string;
  targetClass: string;
  teacherId?: string;
  classroom: string;
}

export interface ExamSubjectDetail {
  subjectId: string;
  durationInMinutes: number;
}

export interface ExamEvent extends BaseScheduleEvent {
  type: EventType.EXAM;
  targetClasses: string[];
  subjects: ExamSubjectDetail[];
  classroom?: string;
}

export interface OtherEvent extends BaseScheduleEvent {
  type: EventType.OTHER;
  label: string;
  targetClasses: string[];
  location: string;
}

export type ScheduleEvent = CourseEvent | ExamEvent | OtherEvent;

export interface Timetable {
  id: string;
  title: string;
  academicYear: string;
  events: ScheduleEvent[];
}
