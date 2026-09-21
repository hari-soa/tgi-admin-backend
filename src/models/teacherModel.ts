import { User } from "./userModel";

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface Teacher extends User {
  subjects: Subject[];
  homeroomClass?: string;
}
