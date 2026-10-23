export type UserRole = "ADMIN" | "TEACHER" | "SECRETARY" | "STUDENT";
export type Gender = "MALE" | "FEMALE";
export type ClassGroup = "SECONDE" | "PREMIERE" | "TERMINALE" | "ANCIEN";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email?: string;
  password?: string;
  matricule: string;
  role: UserRole;
  gender: Gender;
  profilePictureUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
