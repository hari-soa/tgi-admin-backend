import { User } from "./userModel";
import { StudentHistoryRecord } from "./studentHistoryModel";
import { ClassGroup } from "./classGroupEnum";

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export interface Student extends User {
  classRollNumber: number;
  classGroup: ClassGroup;
  dateOfBirth: Date;
  gender: Gender;
  address: string;
  parentsEmail: string;
  parentsContactNumber: string;
  profilePictureUrl: string;
  comments?: string;
  historyRecords?: StudentHistoryRecord[];
}
