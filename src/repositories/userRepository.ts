import { pool } from "../config/db";
import { User } from "../models";

export class UserRepository {
  public static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, first_name, last_name, email, matricule, role, contact_number, profile_picture_url
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  }
}
