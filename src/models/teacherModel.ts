import { User } from "./userModel";
import { ClassGroup } from "./classGroupEnum";

export interface Teacher extends User {
  subjectIds: string[];
  homeroomClass?: ClassGroup;
}
