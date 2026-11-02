import { User } from "./userModel";
export interface Teacher extends User {
  subjectIds: string[];
}
