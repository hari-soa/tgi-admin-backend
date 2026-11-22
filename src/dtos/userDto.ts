export type UserRole = "ADMIN" | "TEACHER" | "SECRETARY" | "STUDENT";
export type ClassGroup = "SECONDE" | "PREMIERE" | "TERMINALE" | "ANCIEN";
export type Gender = "MALE" | "FEMALE";

export interface CreateUserBaseDto {
  firstName: string;
  lastName: string;
  matricule: string;
  gender: Gender;
  profilePictureUrl?: string;
}

export type CreateAdministratorDto = CreateUserBaseDto;

export interface CreateStudentDto extends CreateUserBaseDto {
  classRollNumber: number;
  classGroup: ClassGroup;
  dateOfBirth?: string;
  address?: string;
  parentsEmail?: string;
  parentsContactNumber?: string;
  entryYear?: number;
  graduationYear?: number;
  comments?: string;
}

export interface CreateSecretaryDto extends CreateUserBaseDto {
  department?: string;
}

export interface CreateTeacherDto extends CreateUserBaseDto {
  homeroomClass?: ClassGroup;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  matricule?: string;
  password?: string;
  email?: string;
  contactNumber?: string;
  profilePictureUrl?: string;
  gender?: Gender;
  classRollNumber?: number;
  classGroup?: ClassGroup;
  entryYear?: number;
  dateOfBirth?: string;
  address?: string;
  parentsEmail?: string;
  parentsContactNumber?: string;
  comments?: string;
  graduationYear?: number;
  isActive?: boolean;
  homeroomClass?: ClassGroup;
  department?: string;
}

const COMMON_UPDATE_FIELDS: (keyof UpdateUserDto)[] = [
  "firstName",
  "lastName",
  "matricule",
  "password",
  "email",
  "contactNumber",
  "profilePictureUrl",
  "gender",
];

export const UPDATABLE_FIELDS_BY_ROLE: Record<UserRole, (keyof UpdateUserDto)[]> = {
  ADMIN: COMMON_UPDATE_FIELDS,
  SECRETARY: [...COMMON_UPDATE_FIELDS, "department"],
  TEACHER: [...COMMON_UPDATE_FIELDS, "homeroomClass"],
  STUDENT: [
    ...COMMON_UPDATE_FIELDS,
    "classRollNumber",
    "classGroup",
    "entryYear",
    "dateOfBirth",
    "address",
    "parentsEmail",
    "parentsContactNumber",
    "comments",
    "graduationYear",
    "isActive",
  ],
};
