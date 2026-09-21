import { User, Gender } from "./userModel";

export interface Student extends User {
  classRollNumber: number;
  classGroup: string;
  dateOfBirth: Date;
  gender: Gender;
  address: string;
  parentsEmail: string;
  parentsContactNumber: string;
  comments?: string;
}
