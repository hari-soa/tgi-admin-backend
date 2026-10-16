import { userRepository } from "../repositories/userRepository";
import { generateToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { LoginDto } from "../dtos/authDto";
import bcrypt from "bcrypt";

export interface LoginResult {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    role: string;
  };
  redirectUrl: string;
}

export const authService = {
  login: async (dto: LoginDto): Promise<LoginResult> => {
    const user = await userRepository.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new AppError("Invalid email or matricule", 401);
    }

    const isPasswordValid = await bcrypt.compare(dto.matricule, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or matricule", 401);
    }

    const redirectUrl = user.role === "ADMIN" ? "/dashboard" : "/home";

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      redirectUrl,
    };
  },
};
