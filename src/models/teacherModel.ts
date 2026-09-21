import { User } from "./userModel";
import { Subject } from "./subjectModel";

export interface Teacher extends User {
  subjects: Subject[];
  homeroomClass?: string;
}
