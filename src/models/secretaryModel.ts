import { User } from "./userModel";

export interface Secretary extends User {
  department?: string;
}
