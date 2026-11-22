import { ClassGroup } from "./userDto";

export interface ClassAssignmentDto {
  classGroup: ClassGroup;
  teacherId: string;
}

export interface CreateSubjectDto {
  name: string;
  coefficient: number;
  assignments: ClassAssignmentDto[];
}

export interface UpdateSubjectDto {
  name?: string;
  coefficient?: number;
  assignments?: ClassAssignmentDto[];
}
