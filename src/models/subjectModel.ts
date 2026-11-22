import { ClassGroup } from "../dtos/userDto";

export interface SubjectAssignment {
  classGroup: ClassGroup;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
}

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  isActive: boolean;
  createdAt: Date;
  assignments: SubjectAssignment[];
}
