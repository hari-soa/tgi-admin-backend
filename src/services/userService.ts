import { userRepository } from "../repositories/userRepository";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
} from "../dtos/userDto";
import { AppError } from "../utils/AppError";
import { User } from "../models/userModel";
import bcrypt from "bcrypt";

const generateStudentMatricule = async (
  entryYear: number,
  rollNumber: number,
): Promise<string> => {
  const shortYear = entryYear.toString().slice(-2);
  const formattedRoll = rollNumber.toString().padStart(3, "0");
  const matricule = `TGI${shortYear}${formattedRoll}`;

  const existingUser = await userRepository.findByMatricule(matricule);
  if (existingUser) {
    return generateStudentMatricule(entryYear, rollNumber + 1);
  }

  return matricule;
};

const generateAdminMatricule = async (
  prefix: string = "ADM",
): Promise<string> => {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const matricule = `${prefix}-${year}${randomDigits}`;
  const existingUser = await userRepository.findByMatricule(matricule);
  if (existingUser) {
    return generateAdminMatricule(prefix);
  }
  return matricule;
};

export const userService = {
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

    const matricule = await generateAdminMatricule("ADM");
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return userRepository.createAdministrator(dto, matricule, hashedPassword);
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

    const matricule = await generateStudentMatricule(
      dto.entryYear,
      dto.classRollNumber,
    );
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return userRepository.createStudent(dto, matricule, hashedPassword);
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

    const matricule = await generateAdminMatricule("SEC");
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return userRepository.createSecretary(dto, matricule, hashedPassword);
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

    if (requesterRole === "ADMIN") {
      return targetUser;
    }

    if (requesterId === targetUserId) {
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
};
