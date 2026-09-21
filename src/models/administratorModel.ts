import { User } from "./userModel";

export interface Administrator extends User {
  role: string;
}
