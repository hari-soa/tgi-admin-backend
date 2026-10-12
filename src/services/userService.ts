import { UserRepository } from "../repositories/userRepository";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
} from "../dtos";
import { AppError } from "../utils/AppError";
import { User } from "../models";

export class UserService {
  private static async generateMatricule(
    prefix: string = "TGI",
  ): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Ex: 4421
    const matricule = `${prefix}-${year}${randomDigits}`;

    const existingUser = await UserRepository.findByMatricule(matricule);
    if (existingUser) {
      return this.generateMatricule(prefix); // Récursivité si collision
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
}
