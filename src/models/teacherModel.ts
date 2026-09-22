import { User } from "./userModel";
import { Subject } from "./subjectModel";
import { ClassGroup } from "./classGroupEnum";

export interface Teacher extends User {
  subjects: Subject[];
  homeroomClass?: ClassGroup;
}
