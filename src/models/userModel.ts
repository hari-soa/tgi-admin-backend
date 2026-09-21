export interface User {
  id: string;
  password: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email?: string;
  profilePictureUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
