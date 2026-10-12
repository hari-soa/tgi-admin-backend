import { pool } from "../config/db";
import { User } from "../models";

export class UserRepository {
  public static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, first_name AS "firstName", last_name AS "lastName", email, password, matricule, role, contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl"
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await pool.query<User>(query, [email]);
    return rows[0] || null;
  }
}
