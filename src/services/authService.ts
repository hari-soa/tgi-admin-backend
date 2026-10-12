import { UserRepository } from "../repositories/userRepository";
import { generateToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import { LoginDto } from "../dtos/authDto";

export interface LoginResult {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  redirectUrl: string;
}

export class AuthService {
  public static async login(dto: LoginDto): Promise<LoginResult> {
    const user = await UserRepository.findByEmail(dto.email);

    if (!user) {
      throw new AppError("Invalid email or matricule", 401);
    }

    if (user.matricule !== dto.matricule) {
      throw new AppError("Invalid email or matricule", 401);
    }

    const redirectUrl = user.role === "ADMIN" ? "/dashboard" : "/home";

    // Génération du token JWT
    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
      redirectUrl,
    };
  }
}
