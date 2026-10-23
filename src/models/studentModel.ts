import { User } from "./userModel";
import { ClassGroup, Gender } from "../dtos/userDto";

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
  entryYear: number;
  graduationYear?: number;
  isActive: boolean;
}
