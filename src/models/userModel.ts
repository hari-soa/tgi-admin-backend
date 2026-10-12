export interface User {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email?: string;
  password?: string;
  matricule?: string;
  role: "ADMIN" | "STUDENT" | "SECRETARY" | "TEACHER";
  profilePictureUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
