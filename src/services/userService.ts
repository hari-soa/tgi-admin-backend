import bcrypt from "bcrypt";
import { ZodObject } from "zod";
import { userRepository, UserFilters } from "../repositories/userRepository";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
  CreateTeacherDto,
  updateAdministratorSchema,
  updateSecretarySchema,
  updateStudentSchema,
  updateTeacherSchema,
} from "../dtos/userDto";
import { AppError } from "../utils/AppError";
import { TokenPayload } from "../utils/jwt";
import { assertCanAccessStudentData } from "../utils/accessControl";
import { User, UserRole } from "../models/userModel";

const PASSWORD_SALT_ROUNDS = 10;

const UPDATE_SCHEMA_BY_ROLE: Record<UserRole, ZodObject> = {
  ADMIN: updateAdministratorSchema,
  STUDENT: updateStudentSchema,
  SECRETARY: updateSecretarySchema,
  TEACHER: updateTeacherSchema,
};

/**
 * The matricule is the login credential of every account: it is hashed as
 * the initial password, so it must be unique like the email.
 */
const assertEmailAndMatriculeAreFree = async (
  email: string | undefined,
  matricule: string,
  currentUserId?: string,
): Promise<void> => {
  if (email) {
    const userWithEmail = await userRepository.findByEmail(email);
    if (userWithEmail && userWithEmail.id !== currentUserId) {
      throw new AppError(
        "An account with this email address already exists",
        400,
      );
    }
  }

  const userWithMatricule = await userRepository.findByMatricule(matricule);
  if (userWithMatricule && userWithMatricule.id !== currentUserId) {
    throw new AppError("A user with this matricule already exists", 400);
  }
};

const hashPassword = (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, PASSWORD_SALT_ROUNDS);

export const userService = {
  getAllUsers: async (filters: UserFilters): Promise<User[]> => {
    return userRepository.getAllUsers(filters);
  },

  getStaff: async (): Promise<User[]> => {
    const everyone = await userRepository.getAllUsers();
    return everyone.filter((user) => user.role !== "STUDENT");
  },

  createAdministrator: async (dto: CreateAdministratorDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(dto.email, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createAdministrator(
      dto,
      dto.matricule,
      hashedPassword,
    );
  },

  createStudent: async (dto: CreateStudentDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(dto.email, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createStudent(dto, dto.matricule, hashedPassword);
  },

  createSecretary: async (dto: CreateSecretaryDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(dto.email, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createSecretary(dto, dto.matricule, hashedPassword);
  },

  createTeacher: async (dto: CreateTeacherDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(dto.email, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createTeacher(dto, dto.matricule, hashedPassword);
  },

  getUserById: async (id: string): Promise<User> => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  },

  getUserProfile: async (
    targetUserId: string,
    requester: TokenPayload,
  ): Promise<User> => {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    if (targetUser.role === "STUDENT") {
      assertCanAccessStudentData(requester, targetUserId);
    }
    return targetUser;
  },

  updateUser: async (
    targetUserId: string,
    rawUpdateData: unknown,
  ): Promise<User> => {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    const updateSchema = UPDATE_SCHEMA_BY_ROLE[targetUser.role];
    const updateData = updateSchema.shape.body.parse(rawUpdateData) as Record<
      string,
      unknown
    >;

    const newMatricule = updateData.matricule as string | undefined;
    const newEmail = updateData.email as string | undefined;
    await assertEmailAndMatriculeAreFree(
      newEmail,
      newMatricule ?? targetUser.matricule,
      targetUserId,
    );

    // The matricule is the credential: changing it renews the password unless
    // an explicit password is given.
    const passwordSource =
      (updateData.password as string | undefined) ?? newMatricule;
    const hashedPassword = passwordSource
      ? await hashPassword(passwordSource)
      : undefined;

    await userRepository.updateUserBase(targetUserId, {
      ...updateData,
      password: hashedPassword,
    });

    if (targetUser.role === "STUDENT") {
      await userRepository.updateStudentDetails(targetUserId, updateData);
    } else if (targetUser.role === "SECRETARY") {
      await userRepository.updateSecretaryDetails(targetUserId, updateData);
    } else if (targetUser.role === "TEACHER") {
      await userRepository.updateTeacherDetails(targetUserId, updateData);
    }

    return userService.getUserById(targetUserId);
  },

  deactivateStudent: async (targetUserId: string): Promise<void> => {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser || targetUser.role !== "STUDENT") {
      throw new AppError("Student not found", 404);
    }
    await userRepository.deactivateStudent(targetUserId);
  },

  deleteUser: async (
    targetUserId: string,
    requesterId: string,
  ): Promise<void> => {
    if (targetUserId === requesterId) {
      throw new AppError("You cannot delete your own account", 400);
    }
    const deleted = await userRepository.deleteUser(targetUserId);
    if (!deleted) {
      throw new AppError("User not found", 404);
    }
  },
};
