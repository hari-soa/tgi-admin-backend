export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email?: string;
  profilePictureUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
