import { UserRepository } from "../repositories/userRepository";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
} from "../dtos";
import { AppError } from "../utils/AppError";
import { User } from "../models";
import bcrypt from "bcrypt";

export class UserService {
  private static async generateMatricule(
    prefix: string = "TGI",
  ): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const matricule = `${prefix}-${year}${randomDigits}`;

    const existingUser = await UserRepository.findByMatricule(matricule);
    if (existingUser) {
      return this.generateMatricule(prefix);
    }

    return matricule;
  }

  public static async createAdministrator(
    dto: CreateAdministratorDto,
  ): Promise<User> {
    if (dto.email) {
      const existingUser = await UserRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new AppError(
          "An account with this email address already exists",
          400,
        );
      }
    }

    const matricule = await this.generateMatricule("ADM");
    return UserRepository.createAdministrator(dto, matricule);
  }

  public static async createStudent(dto: CreateStudentDto): Promise<User> {
    if (dto.email) {
      const existingUser = await UserRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new AppError(
          "An account with this email address already exists",
          400,
        );
      }
    }

    const matricule = await this.generateMatricule("STU");
    return UserRepository.createStudent(dto, matricule);
  }

  public static async createSecretary(dto: CreateSecretaryDto): Promise<User> {
    if (dto.email) {
      const existingUser = await UserRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new AppError(
          "An account with this email address already exists",
          400,
        );
      }
    }

    const matricule = await this.generateMatricule("SEC");
    return UserRepository.createSecretary(dto, matricule);
  }

  public static async getUserById(id: string): Promise<User> {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  public static async getUserProfile(
    targetUserId: string,
    requestingUser: { userId: string; role: string },
  ) {
    const targetUser =
      await UserRepository.findUserWithDetailsById(targetUserId);
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
    if (requesterRole === "STUDENT" && targetUser.userType === "STUDENT") {
      throw new AppError(
        "You are not authorized to view another student's profile",
        403,
      );
    }
    if (requesterRole === "STUDENT" || requesterRole === "SECRETARY") {
      return {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        contactNumber: targetUser.contactNumber,
        profilePictureUrl: targetUser.profilePictureUrl,
        userType: targetUser.userType,
        adminRole: targetUser.adminRole,
        department: targetUser.department,
        homeroomClass: targetUser.homeroomClass,
      };
    }
    return targetUser;
  }

  public static async updateUser(
    targetUserId: string,
    updateData: any,
    requesterRole: string,
  ) {
    if (requesterRole !== "ADMIN") {
      throw new AppError(
        "Only administrators are allowed to update user profiles",
        403,
      );
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    await UserRepository.updateUserBase(targetUserId, {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      email: updateData.email,
      password: updateData.password,
      contactNumber: updateData.contactNumber,
      profilePictureUrl: updateData.profilePictureUrl,
    });

    if (targetUser.role === "STUDENT") {
      await UserRepository.updateStudentDetails(targetUserId, updateData);
    } else if (targetUser.role === "SECRETARY") {
      await UserRepository.updateSecretaryDetails(targetUserId, updateData);
    } else if (targetUser.role === "TEACHER") {
      await UserRepository.updateTeacherDetails(targetUserId, updateData);
    }
    return this.getUserProfile(targetUserId, {
      userId: targetUserId,
      role: "ADMIN",
    });
  }
}
