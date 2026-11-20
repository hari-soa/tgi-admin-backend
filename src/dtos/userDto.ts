export type UserRole = "ADMIN" | "TEACHER" | "SECRETARY" | "STUDENT";
export type ClassGroup = "SECONDE" | "PREMIERE" | "TERMINALE" | "ANCIEN";
export type Gender = "MALE" | "FEMALE";

export { genderEnum, classGroupEnum } from "./studentDto";

export {
  createAdministratorSchema,
  updateAdministratorSchema,
} from "./administratorDto";
export type {
  CreateAdministratorDto,
  UpdateAdministratorDto,
} from "./administratorDto";

export { createStudentSchema, updateStudentSchema } from "./studentDto";
export type { CreateStudentDto, UpdateStudentDto } from "./studentDto";

export { createSecretarySchema, updateSecretarySchema } from "./secretaryDto";
export type { CreateSecretaryDto, UpdateSecretaryDto } from "./secretaryDto";

export { createTeacherSchema, updateTeacherSchema } from "./teacherDto";
export type { CreateTeacherDto, UpdateTeacherDto } from "./teacherDto";
