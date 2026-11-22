import bcrypt from "bcrypt";
import { userRepository, UserFilters } from "../repositories/userRepository";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
  CreateTeacherDto,
  UpdateUserDto,
  UPDATABLE_FIELDS_BY_ROLE,
} from "../dtos/userDto";
import { AppError } from "../utils/AppError";
import { TokenPayload } from "../utils/jwt";
import {
  assertCanAccessStudentData,
  assertCanDeleteUser,
  assertCanReachUser,
  filterVisibleUsers,
} from "../utils/accessControl";
import { User } from "../models/userModel";

const PASSWORD_SALT_ROUNDS = 10;

const hashPassword = (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, PASSWORD_SALT_ROUNDS);

const trimText = <TDto extends { firstName?: string; lastName?: string }>(
  dto: TDto,
): TDto => ({
  ...dto,
  ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
  ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
});

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

const pickFieldsOfRole = (
  role: User["role"],
  updateData: UpdateUserDto,
): Record<string, unknown> =>
  Object.fromEntries(
    UPDATABLE_FIELDS_BY_ROLE[role]
      .filter((field) => updateData[field] !== undefined)
      .map((field) => [field, updateData[field]]),
  );

const findUserOrThrow = async (id: string): Promise<User> => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

export const userService = {
  getAllUsers: async (
    filters: UserFilters,
    requester: TokenPayload,
  ): Promise<User[]> => {
    const users = await userRepository.getAllUsers(filters);
    return filterVisibleUsers(requester, users);
  },

  getStaff: async (requester: TokenPayload): Promise<User[]> => {
    const everyone = await userRepository.getAllUsers();
    return filterVisibleUsers(requester, everyone).filter(
      (user) => user.role !== "STUDENT",
    );
  },

  createAdministrator: async (dto: CreateAdministratorDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(undefined, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createAdministrator(
      trimText(dto),
      dto.matricule,
      hashedPassword,
    );
  },

  createStudent: async (dto: CreateStudentDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(undefined, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createStudent(
      trimText(dto),
      dto.matricule,
      hashedPassword,
    );
  },

  createSecretary: async (dto: CreateSecretaryDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(undefined, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createSecretary(
      trimText(dto),
      dto.matricule,
      hashedPassword,
    );
  },

  createTeacher: async (dto: CreateTeacherDto): Promise<User> => {
    await assertEmailAndMatriculeAreFree(undefined, dto.matricule);
    const hashedPassword = await hashPassword(dto.matricule);
    return userRepository.createTeacher(
      trimText(dto),
      dto.matricule,
      hashedPassword,
    );
  },

  getUserById: async (id: string, requester: TokenPayload): Promise<User> => {
    const user = await findUserOrThrow(id);
    assertCanReachUser(requester, user);
    return user;
  },

  getUserProfile: async (
    targetUserId: string,
    requester: TokenPayload,
  ): Promise<User> => {
    const targetUser = await findUserOrThrow(targetUserId);
    assertCanReachUser(requester, targetUser);

    if (targetUser.role === "STUDENT") {
      assertCanAccessStudentData(requester, targetUserId);
    }
    return targetUser;
  },

  updateUser: async (
    targetUserId: string,
    rawUpdateData: UpdateUserDto,
    requester: TokenPayload,
  ): Promise<User> => {
    const targetUser = await findUserOrThrow(targetUserId);
    assertCanReachUser(requester, targetUser);

    const updateData = pickFieldsOfRole(
      targetUser.role,
      trimText(rawUpdateData),
    ) as UpdateUserDto;
    const newEmail = updateData.email?.toLowerCase();
    const normalizedData = {
      ...updateData,
      ...(newEmail ? { email: newEmail } : {}),
    };

    await assertEmailAndMatriculeAreFree(
      newEmail,
      updateData.matricule ?? targetUser.matricule,
      targetUserId,
    );

    const passwordSource = updateData.password ?? updateData.matricule;
    const hashedPassword = passwordSource
      ? await hashPassword(passwordSource)
      : undefined;

    await userRepository.updateUserBase(targetUserId, {
      ...normalizedData,
      password: hashedPassword,
    });

    if (targetUser.role === "STUDENT") {
      await userRepository.updateStudentDetails(targetUserId, normalizedData);
    } else if (targetUser.role === "SECRETARY") {
      await userRepository.updateSecretaryDetails(targetUserId, normalizedData);
    } else if (targetUser.role === "TEACHER") {
      await userRepository.updateTeacherDetails(targetUserId, normalizedData);
    }

    return findUserOrThrow(targetUserId);
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
    const targetUser = await findUserOrThrow(targetUserId);
    assertCanDeleteUser(targetUser);

    if (targetUserId === requesterId) {
      throw new AppError("You cannot delete your own account", 400);
    }
    await userRepository.deleteUser(targetUserId);
  },
};
