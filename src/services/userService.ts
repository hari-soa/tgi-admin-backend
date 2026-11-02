import { userRepository } from "../repositories/userRepository";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
  CreateTeacherDto,
} from "../dtos/userDto";
import { AppError } from "../utils/AppError";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    return userRepository.getAllUsers();
  },

  createAdministrator: async (dto: CreateAdministratorDto): Promise<User> => {
    if (dto.email) {
      const existingUser = await userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new AppError(
          "An account with this email address already exists",
          400,
        );
      }
    }
    const existingMatricule = await userRepository.findByMatricule(
      dto.matricule,
    );
    if (existingMatricule) {
      throw new AppError("A user with this matricule already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(dto.matricule, 10);
    return userRepository.createAdministrator(
      dto,
      dto.matricule,
      hashedPassword,
    );
  },

  createStudent: async (dto: CreateStudentDto): Promise<User> => {
    if (dto.email) {
      const existingUser = await userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new AppError(
          "An account with this email address already exists",
          400,
        );
      }
    }
    const existingMatricule = await userRepository.findByMatricule(
      dto.matricule,
    );
    if (existingMatricule) {
      throw new AppError("A user with this matricule already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(dto.matricule, 10);
    return userRepository.createStudent(dto, dto.matricule, hashedPassword);
  },

  createSecretary: async (dto: CreateSecretaryDto): Promise<User> => {
    if (dto.email) {
      const existingUser = await userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new AppError(
          "An account with this email address already exists",
          400,
        );
      }
    }
    const existingMatricule = await userRepository.findByMatricule(
      dto.matricule,
    );
    if (existingMatricule) {
      throw new AppError("A user with this matricule already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(dto.matricule, 10);
    return userRepository.createSecretary(dto, dto.matricule, hashedPassword);
  },

  createTeacher: async (dto: CreateTeacherDto): Promise<User> => {
    if (dto.email) {
      const existingUser = await userRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new AppError(
          "An account with this email address already exists",
          400,
        );
      }
    }
    const existingMatricule = await userRepository.findByMatricule(
      dto.matricule,
    );
    if (existingMatricule) {
      throw new AppError("A user with this matricule already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(dto.matricule, 10);
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
    requestingUser: { userId: string; role: string },
  ) => {
    const targetUser =
      await userRepository.findUserWithDetailsById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }
    const { userId: requesterId, role: requesterRole } = requestingUser;

    if (requesterRole === "ADMIN" || requesterId === targetUserId) {
      return targetUser;
    }
    if (requesterRole === "STUDENT" && targetUser.role === "STUDENT") {
      throw new AppError(
        "You are not authorized to view another student's profile",
        403,
      );
    }
    return targetUser;
  },

  updateUser: async (
    targetUserId: string,
    updateData: any,
    requesterRole: string,
  ) => {
    if (requesterRole !== "ADMIN") {
      throw new AppError(
        "Only administrators are allowed to update user profiles",
        403,
      );
    }
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    await userRepository.updateUserBase(targetUserId, {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      password: updateData.password,
      contactNumber: updateData.contactNumber,
      profilePictureUrl: updateData.profilePictureUrl,
    });

    if (targetUser.role === "STUDENT") {
      await userRepository.updateStudentDetails(targetUserId, updateData);
    } else if (targetUser.role === "SECRETARY") {
      await userRepository.updateSecretaryDetails(targetUserId, updateData);
    } else if (targetUser.role === "TEACHER") {
      await userRepository.updateTeacherDetails(targetUserId, updateData);
    }

    return userService.getUserProfile(targetUserId, {
      userId: targetUserId,
      role: "ADMIN",
    });
  },

  deactivateStudent: async (targetUserId: string): Promise<void> => {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }
    await userRepository.deactivateStudent(targetUserId);
  },

  deleteUser: async (targetUserId: string): Promise<void> => {
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }
    await userRepository.deleteUser(targetUserId);
  },
};
