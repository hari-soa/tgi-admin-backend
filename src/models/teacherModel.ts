import { User } from "./userModel";

export interface Subject {
  id: string;
  name: string;
  coefficient: number;
  targetClasses: string[];
}

export interface Teacher extends User {
  subjects: Subject[];
  homeroomClass?: string;
}
