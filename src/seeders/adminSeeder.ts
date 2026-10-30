import bcrypt from "bcrypt";
import { pool } from "../config/db";

export const seedSuperAdmin = async (): Promise<void> => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const rawPassword = process.env.SUPER_ADMIN_PASSWORD!;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const checkQuery = `SELECT id FROM users WHERE user_type = $1 LIMIT 1;`;
    const checkResult = await pool.query(checkQuery, ["ADMIN"]);

    let adminId: string;

    if (checkResult.rows.length > 0) {
      adminId = checkResult.rows[0].id;
    } else {
      const insertUserQuery = `
        INSERT INTO users (first_name, last_name, contact_number, email, password, matricule, user_type, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;

      const userValues = [
        "Super",
        "Admin",
        "0000000000",
        adminEmail,
        hashedPassword,
        "ADM-001",
        "ADMIN",
        "MALE",
      ];

      const userResult = await pool.query(insertUserQuery, userValues);
      adminId = userResult.rows[0].id;
    }

    const checkAdminTableQuery = `SELECT user_id FROM administrators WHERE user_id = $1 LIMIT 1;`;
    const checkAdminTableResult = await pool.query(checkAdminTableQuery, [
      adminId,
    ]);

    if (checkAdminTableResult.rows.length === 0) {
      const insertAdminQuery = `
        INSERT INTO administrators (user_id, role)
        VALUES ($1, $2);
      `;
      await pool.query(insertAdminQuery, [adminId, "SUPER_ADMIN"]);
      console.log("Super Admin successfully linked to administrators table");
    }
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
    throw error;
  }
};
